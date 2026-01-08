import { config } from './config.js';

export type AvatarStyle = 'cartoon' | 'anime' | 'pixel' | 'fantasy' | 'sketch';

export const AVATAR_STYLES: AvatarStyle[] = ['cartoon', 'anime', 'pixel', 'fantasy', 'sketch'];

export interface AvatarGenerationResult {
  success: boolean;
  imageBase64?: string;
  error?: string;
}

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
    role: string;
  };
  finishReason: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    code: number;
    message: string;
  };
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
const GENERATION_TIMEOUT_MS = 30000;

const STYLE_PROMPTS: Record<AvatarStyle, string> = {
  cartoon: 'Transform this photo into a vibrant cartoon-style avatar. Use bold outlines, simplified features, bright saturated colors, and a clean Disney/Pixar-inspired look. Keep the person recognizable but stylized.',
  anime: 'Transform this photo into an anime-style avatar. Use large expressive eyes, stylized hair, smooth shading, and the aesthetic of Japanese animation. Make it look like a character from a popular anime series.',
  pixel: 'Transform this photo into a retro pixel art avatar at 64x64 or 128x128 resolution. Use limited color palette, visible pixels, and classic video game aesthetic like early RPG character portraits.',
  fantasy: 'Transform this photo into an epic fantasy portrait avatar. Add magical elements like glowing eyes, ethereal lighting, mystical aura, or subtle fantasy features. Think high fantasy book cover art.',
  sketch: 'Transform this photo into a hand-drawn pencil sketch avatar. Use crosshatching, artistic linework, and grayscale shading like a professional portrait artist sketch. Keep artistic imperfections for character.',
};

/**
 * Validates if a string is a valid AvatarStyle
 */
export function isValidStyle(style: string): style is AvatarStyle {
  return AVATAR_STYLES.includes(style as AvatarStyle);
}

/**
 * Generate a stylized avatar using Gemini 2.0 Flash
 * @param photoBase64 The source photo as base64 (with or without data URI prefix)
 * @param style The desired avatar style
 * @returns Result with base64 avatar image or error
 */
export async function generateAvatar(
  photoBase64: string,
  style: AvatarStyle
): Promise<AvatarGenerationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  try {
    // Extract base64 data without the data URI prefix if present
    let imageData = photoBase64;
    let mimeType = 'image/jpeg';

    if (photoBase64.startsWith('data:')) {
      const matches = photoBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1] ?? 'image/jpeg';
        imageData = matches[2] ?? '';
      }
    }

    const stylePrompt = STYLE_PROMPTS[style];

    const response = await fetch(`${GEMINI_API_URL}?key=${config.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageData,
                },
              },
              {
                text: `${stylePrompt}\n\nGenerate ONLY the transformed avatar image. Output the image directly.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['image', 'text'],
          responseMimeType: 'image/png',
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return {
        success: false,
        error: `Avatar generation failed: ${response.status}`,
      };
    }

    const data = await response.json() as GeminiResponse;

    if (data.error) {
      console.error('Gemini API error:', data.error);
      return {
        success: false,
        error: data.error.message,
      };
    }

    if (!data.candidates || data.candidates.length === 0) {
      return {
        success: false,
        error: 'No response from Gemini API',
      };
    }

    // Look for image in response
    const candidate = data.candidates[0];
    if (!candidate) {
      return {
        success: false,
        error: 'Invalid response from Gemini API',
      };
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return {
          success: true,
          imageBase64: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        };
      }
    }

    // If no image found, check for text response (which might indicate an error)
    const textPart = candidate.content.parts.find((p) => p.text);
    if (textPart?.text) {
      console.error('Gemini returned text instead of image:', textPart.text);
    }

    return {
      success: false,
      error: 'No image returned from Gemini API',
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Avatar generation timed out',
        };
      }
      console.error('Gemini avatar generation error:', error.message);
      return {
        success: false,
        error: `Avatar generation failed: ${error.message}`,
      };
    }

    return {
      success: false,
      error: 'Unknown error during avatar generation',
    };
  }
}
