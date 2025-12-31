#!/usr/bin/env node

/**
 * Test script for Gemini Image Generator skill
 * This simulates the skill functionality without Claude Code framework
 */

import GeminiImageClient from './src/lib/gemini-client.js';
import { validatePrompt, validateTheme, validateAspectRatio } from './src/utils/validation.js';

async function testImageGeneration() {
  console.log('🎨 Testing Gemini Image Generator Skill');
  console.log('='.repeat(50));

  try {
    // Initialize client
    console.log('📡 Initializing Gemini client...');
    const client = new GeminiImageClient();
    console.log('✅ Gemini client initialized successfully\n');

    // Test 1: Simple image generation
    console.log('🧪 Test 1: Simple photorealistic landscape');
    console.log('-------------------------------------------');

    const prompt1 = 'a serene mountain landscape at sunset with golden light';
    const options1 = {
      theme: 'photorealistic',
      aspectRatio: '16:9',
      quality: 80
    };

    // Validate inputs
    const promptValidation1 = validatePrompt(prompt1);
    const themeValidation1 = validateTheme(options1.theme);
    const ratioValidation1 = validateAspectRatio(options1.aspectRatio);

    if (!promptValidation1.valid || !themeValidation1.valid || !ratioValidation1.valid) {
      console.log('❌ Validation failed:', {
        prompt: promptValidation1.error,
        theme: themeValidation1.error,
        ratio: ratioValidation1.error
      });
      return;
    }

    console.log(`📝 Prompt: ${prompt1}`);
    console.log(`🎨 Theme: ${options1.theme}`);
    console.log(`📐 Aspect Ratio: ${options1.ratio}`);
    console.log(`🎯 Quality: ${options1.quality}`);
    console.log('🚀 Generating image...');

    const result1 = await client.generateImage(prompt1, options1);

    if (result1.success) {
      console.log('✅ Image generated successfully!');
      console.log(`📊 Image data length: ${result1.imageData ? result1.imageData.length : 0} characters`);
      console.log(`🕒 Generated at: ${result1.metadata.timestamp}`);

      // Save the image
      const filename = client.generateFilename(prompt1, options1.theme);
      const savedPath = await client.saveImage(result1.imageData, filename);
      console.log(`💾 Image saved to: ${savedPath}`);
    } else {
      console.log('❌ Image generation failed:', result1.error);
    }

    console.log('\n' + '='.repeat(50));

    // Test 2: Anime style with different ratio
    console.log('🧪 Test 2: Anime-style character art');
    console.log('-------------------------------------');

    const prompt2 = 'futuristic cyberpunk character with neon glowing accessories';
    const options2 = {
      theme: 'anime',
      aspectRatio: '1:1',
      quality: 90,
      style: 'vibrant colors, detailed clothing, dynamic pose'
    };

    console.log(`📝 Prompt: ${prompt2}`);
    console.log(`🎨 Theme: ${options2.theme}`);
    console.log(`📐 Aspect Ratio: ${options2.ratio}`);
    console.log(`🎯 Quality: ${options2.quality}`);
    console.log(`🎭 Style: ${options2.style}`);
    console.log('🚀 Generating image...');

    const result2 = await client.generateImage(prompt2, options2);

    if (result2.success) {
      console.log('✅ Image generated successfully!');
      console.log(`📊 Image data length: ${result2.imageData ? result2.imageData.length : 0} characters`);
      console.log(`🕒 Generated at: ${result2.metadata.timestamp}`);

      // Save the image
      const filename2 = client.generateFilename(prompt2, options2.theme);
      const savedPath2 = await client.saveImage(result2.imageData, filename2);
      console.log(`💾 Image saved to: ${savedPath2}`);
    } else {
      console.log('❌ Image generation failed:', result2.error);
    }

    console.log('\n' + '='.repeat(50));

    // Test 3: Test error handling with invalid theme
    console.log('🧪 Test 3: Error handling with invalid theme');
    console.log('--------------------------------------------');

    const invalidTheme = 'invalid-theme-name';
    const themeValidation2 = validateTheme(invalidTheme);

    if (!themeValidation2.valid) {
      console.log('✅ Error handling working correctly');
      console.log(`❌ Validation error: ${themeValidation2.error}`);
    } else {
      console.log('❌ Error handling failed - invalid theme was accepted');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testImageGeneration().catch(console.error);