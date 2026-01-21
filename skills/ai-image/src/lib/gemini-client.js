import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import mime from 'mime';

class GeminiImageClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.client = new GoogleGenAI({
      apiKey: this.apiKey,
    });
    // Use model that supports image generation
    this.model = 'gemini-3-pro-image-preview';
  }

  /**
   * Generate an image using Gemini API with streaming support
   * @param {string} prompt - The text prompt for image generation
   * @param {Object} options - Generation options
   * @param {string} options.theme - Artistic theme to apply
   * @param {string} options.aspectRatio - Aspect ratio (e.g., "16:9", "1:1")
   * @param {string} options.style - Additional style parameters
   * @param {number} options.quality - Quality factor (1-100)
   * @param {boolean} options.enableGoogleSearch - Enable Google Search tool
   * @param {string} options.imageSize - Image size ('1K', '2K', etc.)
   * @param {Function} options.onProgress - Callback for streaming progress
   * @returns {Promise<Object>} Generated image data
   */
  async generateImage(prompt, options = {}) {
    try {
      const {
        theme = 'photorealistic',
        aspectRatio = '16:9',
        style = '',
        quality = 80,
        enableGoogleSearch = false,
        imageSize = '1K',
        onProgress = null
      } = options;

      // Enhance prompt with theme and style
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, theme, style, aspectRatio);

      console.log('Generating image with prompt:', enhancedPrompt);

      // Configure tools
      const tools = [];
      if (enableGoogleSearch) {
        tools.push({
          googleSearch: {}
        });
      }

      // Configure generation
      const config = {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: {
          imageSize: imageSize,
        },
        ...(tools.length > 0 && { tools }),
      };

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: enhancedPrompt,
            },
          ],
        },
      ];

      // Use streaming API
      const response = await this.client.models.generateContentStream({
        model: this.model,
        config,
        contents,
      });

      let fileIndex = 0;
      const generatedImages = [];
      const generatedText = [];

      // Process streaming response
      for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
          continue;
        }

        const parts = chunk.candidates[0].content.parts;

        for (const part of parts) {
          if (part.inlineData) {
            const fileName = `generated_image_${fileIndex++}`;
            const inlineData = part.inlineData;
            const fileExtension = mime.getExtension(inlineData.mimeType || 'image/png');
            const buffer = Buffer.from(inlineData.data || '', 'base64');

            // Store the image data
            generatedImages.push({
              mimeType: inlineData.mimeType,
              data: inlineData.data
            });

            // Call progress callback if provided
            if (onProgress) {
              onProgress({
                type: 'image',
                fileName: `${fileName}.${fileExtension}`,
                index: generatedImages.length - 1
              });
            }
          } else if (part.text) {
            generatedText.push(part.text);
            console.log(part.text);

            // Call progress callback if provided
            if (onProgress) {
              onProgress({
                type: 'text',
                content: part.text
              });
            }
          }
        }
      }

      if (generatedImages.length === 0) {
        throw new Error('No images generated - empty response from Gemini');
      }

      return {
        success: true,
        images: generatedImages,
        text: generatedText.join(' '),
        metadata: {
          prompt: enhancedPrompt,
          theme: theme,
          aspectRatio: aspectRatio,
          quality: quality,
          imageSize: imageSize,
          enableGoogleSearch: enableGoogleSearch,
          model: this.model,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Build an enhanced prompt that includes theme and style information
   * @param {string} basePrompt - Original user prompt
   * @param {string} theme - Artistic theme
   * @param {string} style - Additional style
   * @param {string} aspectRatio - Target aspect ratio
   * @returns {string} Enhanced prompt
   */
  buildEnhancedPrompt(basePrompt, theme, style, aspectRatio) {
    const themePrompts = {
      'photorealistic': 'photorealistic, highly detailed, professional photography, natural lighting, realistic textures',
      'anime': 'anime style, manga art, Japanese animation style, vibrant colors, clean lines',
      'oil-painting': 'oil painting, classical art, brush strokes visible, rich textures, artistic masterpiece',
      'watercolor': 'watercolor painting, soft edges, transparent colors, wet on wet technique, artistic',
      'digital-art': 'digital art, modern illustration, clean, professional digital artwork',
      'sketch': 'pencil sketch, charcoal drawing, black and white, detailed line work',
      'impressionist': 'impressionist style, loose brush strokes, play of light, artistic interpretation',
      'surreal': 'surrealism, dreamlike, abstract, imaginative, otherworldly',
      'cyberpunk': 'cyberpunk aesthetic, neon colors, futuristic, sci-fi, high-tech low-life',
      'fantasy': 'fantasy art, magical, ethereal, mythical, imaginative',
      'vintage': 'vintage style, retro, aged, classic, nostalgic feel',
      'minimalist': 'minimalist design, clean, simple, reduced complexity, essential elements',
      'hand-drawn': 'minimalist hand-drawn sketch, traditional graphite pencil art, organic lines, rough paper texture, visible fibers, monochrome graphite tones, centered composition with generous negative space, avoiding digital smoothness or vector style',
      'comic-sketch': 'minimalist black and white comic manuscript style, raw expressionist sketch, multi-panel comic layout with hand-drawn irregular borders, flat 2D perspective, heavy negative space, jagged organic lines, high contrast, off-white paper texture, dark graphite lines, indie graphic novel aesthetic, avoiding color, gradients, and vector smoothness',
      'shin-hanga': 'Shin-hanga style, 20th century Japanese New Print movement, Ukiyo-e aesthetics combined with Western Impressionist lighting, serene melancholy, atmospheric landscape. Woodblock print texture with Bokashi color gradients and Goma-zuri granular effects. Washi paper texture, organic lines with geometric color blocks, diagonal composition. Low saturation cool tones palette (Prussian Blue, Slate Grey, Paper White, Charcoal Black). Avoiding photorealism, digital smoothness, persistent 3D rendering, or heavy oil painting impasto.',
      'swiss-tech': 'Swiss Style technical deconstruction illustration, absolute rationality and precision engineering aesthetics. Orthographic view, invisible grid alignment, hard-edge vector line art, geometric accuracy, uniform line weights. Black and white color scheme: black lines (#000000), "ink black" fills for main areas, single "Cinnabar Red" highlight for core functional parts. Background: vintage plotting paper texture with slight grain. Avoiding photorealism, complex lighting, gradients, chaos. Absolute flatness and diagrammatic look.'
    };

    const ratioPrompts = {
      '1:1': 'square composition, balanced',
      '16:9': 'wide landscape, cinematic composition',
      '4:3': 'standard composition, traditional',
      '3:2': 'photography standard, well-balanced',
      '2:1': 'panoramic, wide format',
      '9:16': 'portrait orientation, vertical composition',
      '3:4': 'vertical portrait, traditional'
    };

    const themeDescription = themePrompts[theme] || themePrompts['photorealistic'];
    const ratioDescription = ratioPrompts[aspectRatio] || ratioPrompts['16:9'];

    let enhancedPrompt = `Generate a ${themeDescription} image of: ${basePrompt}. `;

    enhancedPrompt += `The image should have a ${ratioDescription} aspect ratio. `;

    if (style) {
      enhancedPrompt += `Additional style: ${style}. `;
    }

    enhancedPrompt += 'Ensure high quality, artistic merit, and attention to detail.';

    return enhancedPrompt;
  }

  /**
   * Extract image data from Gemini response parts
   * @param {Array} parts - Response parts from Gemini
   * @returns {string|null} Base64 image data or null if not found
   */
  extractImageData(parts) {
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data; // Base64 image data
      }
    }
    return null;
  }

  /**
   * Save generated image buffer to file
   * @param {Buffer} buffer - Image buffer data
   * @param {string} filename - Output filename
   * @param {string} outputDir - Output directory
   * @returns {Promise<string>} Path to saved file
   */
  async saveImageBuffer(buffer, filename, outputDir = './output') {
    try {
      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filePath = path.join(outputDir, filename);

      await fs.promises.writeFile(filePath, buffer);
      console.log(`File ${filename} saved to file system.`);
      return filePath;
    } catch (error) {
      console.error('Error saving image buffer:', error);
      throw new Error(`Failed to save image buffer: ${error.message}`);
    }
  }

  /**
   * Save generated image to file (legacy method for backward compatibility)
   * @param {string} imageData - Base64 image data
   * @param {string} filename - Output filename
   * @param {string} outputDir - Output directory
   * @returns {Promise<string>} Path to saved file
   */
  async saveImage(imageData, filename, outputDir = './output') {
    try {
      const buffer = Buffer.from(imageData, 'base64');
      return await this.saveImageBuffer(buffer, filename, outputDir);
    } catch (error) {
      console.error('Error saving image:', error);
      throw new Error(`Failed to save image: ${error.message}`);
    }
  }

  /**
   * Generate unique filename for image
   * @param {string} prompt - Original prompt
   * @param {string} theme - Theme used
   * @returns {string} Unique filename
   */
  generateFilename(prompt, theme) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day}-${hour}${minute}${second}`;

    // Get first 4 valid characters
    let prefix = prompt.trim()
      .replace(/[^\p{L}\p{N}]/gu, '')
      .slice(0, 4);

    if (!prefix) {
      prefix = 'img';
    }

    return `${prefix}-${timestamp}.png`;
  }

  /**
   * Validate API key and connection
   * @returns {Promise<boolean>} True if API is accessible
   */
  async validateConnection() {
    try {
      // Simple test with streaming
      const response = await this.client.models.generateContentStream({
        model: this.model,
        config: {
          responseModalities: ['TEXT'],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        ],
      });

      // Try to read first chunk
      for await (const chunk of response) {
        if (chunk.text) {
          return true;
        }
      }
      return true;
    } catch (error) {
      console.error('API connection validation failed:', error.message);
      return false;
    }
  }
}

export default GeminiImageClient;