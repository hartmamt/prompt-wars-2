import { useState, useRef, useCallback } from 'react';

export type AvatarOption = 'discord' | 'upload' | 'ai';
export type AvatarStyle = 'cartoon' | 'anime' | 'pixel' | 'fantasy' | 'sketch';

const AVATAR_STYLES: { value: AvatarStyle; label: string }[] = [
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'anime', label: 'Anime' },
  { value: 'pixel', label: 'Pixel Art' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sketch', label: 'Sketch' },
];

interface AvatarSelectorProps {
  discordAvatarUrl: string | null;
  currentAvatar: string | null;
  onAvatarChange: (avatar: string | null) => void;
  disabled?: boolean;
  aiAvatarsEnabled?: boolean;
}

function cropToSquare(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Determine crop dimensions (center square crop)
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;

      // Output at 256x256
      canvas.width = 256;
      canvas.height = 256;

      ctx.drawImage(img, x, y, size, size, 0, 0, 256, 256);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.readAsDataURL(file);
  });
}

export function AvatarSelector({
  discordAvatarUrl,
  currentAvatar,
  onAvatarChange,
  disabled = false,
  aiAvatarsEnabled = true,
}: AvatarSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<AvatarOption>('discord');
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>('cartoon');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOptionChange = useCallback(
    (option: AvatarOption) => {
      setSelectedOption(option);
      setError(null);

      if (option === 'discord') {
        onAvatarChange(discordAvatarUrl);
      } else if (option === 'upload' && uploadedPhoto) {
        onAvatarChange(uploadedPhoto);
      }
      // For AI, avatar is only set after generation
    },
    [discordAvatarUrl, uploadedPhoto, onAvatarChange]
  );

  const handleFileUploadAsync = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      try {
        const croppedImage = await cropToSquare(file);
        setUploadedPhoto(croppedImage);
        setError(null);
        if (selectedOption === 'upload') {
          onAvatarChange(croppedImage);
        }
      } catch (err) {
        setError('Failed to process image');
        console.error('Image processing error:', err);
      }
    },
    [selectedOption, onAvatarChange]
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      void handleFileUploadAsync(file);
    },
    [handleFileUploadAsync]
  );

  const handleGenerateAvatarAsync = useCallback(async () => {
    if (!uploadedPhoto) {
      setError('Please upload a photo first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/avatar/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoBase64: uploadedPhoto,
          style: selectedStyle,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        imageBase64?: string;
        error?: string;
      };

      if (!result.success || !result.imageBase64) {
        throw new Error(result.error ?? 'Avatar generation failed');
      }

      onAvatarChange(result.imageBase64);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      console.error('Avatar generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedPhoto, selectedStyle, onAvatarChange]);

  const handleGenerateAvatar = useCallback(() => {
    void handleGenerateAvatarAsync();
  }, [handleGenerateAvatarAsync]);

  const getPreviewImage = () => {
    if (selectedOption === 'discord') {
      return discordAvatarUrl;
    }
    if (selectedOption === 'upload' || selectedOption === 'ai') {
      // During AI generation, show the uploaded photo; after generation, show result
      if (selectedOption === 'ai' && currentAvatar && currentAvatar !== discordAvatarUrl && currentAvatar !== uploadedPhoto) {
        return currentAvatar;
      }
      return uploadedPhoto;
    }
    return null;
  };

  const previewImage = getPreviewImage();

  return (
    <div className="w-full max-w-md">
      <div className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-prompt-pink">
        ◆ CHOOSE YOUR BATTLE AVATAR ◆
      </div>

      {/* Preview */}
      <div className="mb-4 flex justify-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-prompt-purple bg-gray-800 md:h-32 md:w-32">
          {previewImage ? (
            <img
              src={previewImage}
              alt="Avatar preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-gray-600">
              ?
            </div>
          )}
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="animate-spin text-2xl">⚙️</div>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500 bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Options */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => handleOptionChange('discord')}
          disabled={disabled}
          className={`rounded-lg border-2 p-3 text-xs font-bold transition-all md:text-sm ${
            selectedOption === 'discord'
              ? 'border-prompt-purple bg-prompt-purple/20 text-prompt-purple'
              : 'border-gray-700 text-gray-400 hover:border-gray-600'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          Discord
        </button>
        <button
          onClick={() => handleOptionChange('upload')}
          disabled={disabled}
          className={`rounded-lg border-2 p-3 text-xs font-bold transition-all md:text-sm ${
            selectedOption === 'upload'
              ? 'border-prompt-purple bg-prompt-purple/20 text-prompt-purple'
              : 'border-gray-700 text-gray-400 hover:border-gray-600'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          Upload
        </button>
        <button
          onClick={() => handleOptionChange('ai')}
          disabled={disabled || !aiAvatarsEnabled}
          title={!aiAvatarsEnabled ? 'AI avatars require Nano Banana model' : undefined}
          className={`rounded-lg border-2 p-3 text-xs font-bold transition-all md:text-sm ${
            selectedOption === 'ai'
              ? 'border-prompt-purple bg-prompt-purple/20 text-prompt-purple'
              : 'border-gray-700 text-gray-400 hover:border-gray-600'
          } ${disabled || !aiAvatarsEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          AI Style
          {!aiAvatarsEnabled && <span className="block text-[10px] text-gray-500 mt-0.5">N/A</span>}
        </button>
      </div>

      {/* Upload section */}
      {(selectedOption === 'upload' || selectedOption === 'ai') && (
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={disabled || isGenerating}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isGenerating}
            className="w-full rounded-lg border-2 border-dashed border-gray-600 bg-gray-900 px-4 py-3 text-sm text-gray-400 transition-all hover:border-gray-500 hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadedPhoto ? '📷 Change Photo' : '📷 Upload Photo'}
          </button>
        </div>
      )}

      {/* AI Style selector */}
      {selectedOption === 'ai' && (
        <div className="mb-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Style:
          </div>
          <div className="grid grid-cols-5 gap-1">
            {AVATAR_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                disabled={disabled || isGenerating}
                className={`rounded px-2 py-2 text-xs font-medium transition-all ${
                  selectedStyle === style.value
                    ? 'bg-prompt-pink text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                } ${disabled || isGenerating ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate button for AI */}
      {selectedOption === 'ai' && uploadedPhoto && (
        <button
          onClick={handleGenerateAvatar}
          disabled={disabled || isGenerating}
          className={`w-full rounded-lg px-4 py-3 text-sm font-bold transition-all ${
            isGenerating
              ? 'cursor-not-allowed bg-gray-700 text-gray-400'
              : 'bg-prompt-green text-black hover:bg-green-400'
          }`}
        >
          {isGenerating ? '⚙️ GENERATING...' : '✨ GENERATE AI AVATAR'}
        </button>
      )}
    </div>
  );
}
