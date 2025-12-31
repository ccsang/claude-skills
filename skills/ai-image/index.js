#!/usr/bin/env node
import { Command } from 'commander';
import GeminiImageClient from './src/lib/gemini-client.js';
import dotenv from 'dotenv';
dotenv.config();

const program = new Command();

program
  .name('ai-image')
  .description('Generate high-quality AI images using Google\'s Gemini API')
  .version('1.0.0');

program
  .argument('<prompt>', 'Prompt for image generation')
  .option('-t, --theme <theme>', 'Artistic theme', 'photorealistic')
  .option('-r, --ratio <ratio>', 'Aspect ratio (e.g., 16:9, 1:1)', '16:9')
  .option('-s, --style <style>', 'Additional style description', '')
  .option('-q, --quality <number>', 'Image quality (1-100)', '80')
  .option('--save', 'Save the generated image to file', false)
  .option('-o, --output-dir <path>', 'Output directory', './output')
  .option('--filename <name>', 'Custom filename', null)
  .option('-v, --verbose', 'Enable verbose output', false)
  .action(async (prompt, options) => {
    try {
      if (options.verbose) {
        console.log('🎨 Gemini Image Generator');
        console.log(`Prompt: ${prompt}`);
      }

      const client = new GeminiImageClient();

      // Basic validation wrapper
      if (!process.env.GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY environment variable is required.');
        process.exit(1);
      }

      if (options.verbose) console.log('🚀 Generating image...');

      const result = await client.generateImage(prompt, {
        theme: options.theme,
        aspectRatio: options.ratio,
        style: options.style,
        quality: parseInt(options.quality)
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      if (options.save && result.images && result.images.length > 0) {
        for (let i = 0; i < result.images.length; i++) {
          const img = result.images[i];
          let filename = options.filename;

          if (!filename) {
            filename = client.generateFilename(prompt, options.theme);
          }

          // If multiple images and filename provided or generated, ensure uniqueness
          if (result.images.length > 1) {
            const ext = filename.split('.').pop();
            const base = filename.substring(0, filename.lastIndexOf('.'));
            filename = `${base}_${i}.${ext}`;
          }

          const savedPath = await client.saveImage(img.data, filename, options.outputDir);
          console.log(`✅ Image saved to: ${savedPath}`);
        }
      } else if (options.save) {
        console.warn('⚠️ No images generated to save.');
      } else {
        console.log('✅ Image generated successfully (not saved). Use --save to write to disk.');
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse();