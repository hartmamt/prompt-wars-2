import { config } from './config.js';

export interface FluxGenerationResult {
  success: boolean;
  imageBase64?: string;
  error?: string;
}

interface FalImage {
  url: string;
  width: number;
  height: number;
  content_type: string;
}

interface FalResponse {
  images: FalImage[];
  timings: {
    inference: number;
  };
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

const FAL_API_URL = 'https://fal.run/fal-ai/flux/schnell';
const GENERATION_TIMEOUT_MS = 30000;

/**
 * Generate an image using Flux Schnell via fal.ai
 * @param prompt The text prompt for image generation
 * @returns Result with base64 image data or error
 */
export async function generateImage(prompt: string): Promise<FluxGenerationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  try {
    const response = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${config.falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square_hd',
        num_inference_steps: 4,
        enable_safety_checker: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Flux API error:', response.status, errorText);
      return {
        success: false,
        error: `Image generation failed: ${response.status}`,
      };
    }

    const data = await response.json() as FalResponse;

    if (!data.images || data.images.length === 0) {
      return {
        success: false,
        error: 'No image returned from API',
      };
    }

    const imageUrl = data.images[0]?.url;
    if (!imageUrl) {
      return {
        success: false,
        error: 'Invalid image URL in response',
      };
    }

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return {
        success: false,
        error: 'Failed to fetch generated image',
      };
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const contentType = data.images[0]?.content_type ?? 'image/jpeg';

    return {
      success: true,
      imageBase64: `data:${contentType};base64,${base64}`,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Image generation timed out',
        };
      }
      console.error('Flux generation error:', error.message);
      return {
        success: false,
        error: `Generation failed: ${error.message}`,
      };
    }

    return {
      success: false,
      error: 'Unknown error during image generation',
    };
  }
}
