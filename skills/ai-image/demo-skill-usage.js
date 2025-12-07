#!/usr/bin/env node

/**
 * Demo script showcasing the Gemini Image Generator skill functionality
 * This demonstrates how the skill would work with a real API
 */

const { validatePrompt, validateTheme, validateAspectRatio } = require('./src/utils/validation');
const { parseCommand } = require('./src/utils/options');

// Mock Gemini response for demonstration
const mockGeminiResponse = {
  success: true,
  imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent PNG
  metadata: {
    timestamp: new Date().toISOString(),
    model: 'gemini-2.0-flash-exp-image-generation'
  }
};

function simulateGeminiAPI(prompt, options) {
  return new Promise((resolve) => {
    console.log(`🎨 Simulating image generation for: "${prompt}"`);
    console.log(`   Theme: ${options.theme}, Ratio: ${options.ratio}, Quality: ${options.quality}`);

    // Simulate API delay
    setTimeout(() => {
      resolve({
        success: true,
        imageData: mockGeminiResponse.imageData,
        metadata: {
          ...mockGeminiResponse.metadata,
          prompt: prompt,
          theme: options.theme,
          aspectRatio: options.ratio,
          quality: options.quality
        }
      });
    }, 1500);
  });
}

async function saveMockImage(imageData, filename) {
  const fs = require('fs');
  const path = require('path');

  // Create output directory
  const outputDir = './output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, Buffer.from(imageData, 'base64'));
  return filePath;
}

function generateFilename(prompt, theme) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const promptSlug = prompt.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
  return `${promptSlug}-${theme}-${timestamp}.png`;
}

async function demonstrateSkill() {
  console.log('🎨 Gemini Image Generator Skill Demo');
  console.log('='.repeat(50));

  // Demo 1: Parse and validate a complete command
  console.log('\n📝 Demo 1: Command Parsing & Validation');
  console.log('----------------------------------------');

  const command = 'beautiful sunset over mountains --theme photorealistic --ratio 16:9 --save --quality 90';
  const schema = [
    {
      name: 'theme',
      alias: 't',
      type: 'string',
      choices: ['photorealistic', 'anime', 'oil-painting'],
      default: 'photorealistic'
    },
    {
      name: 'ratio',
      alias: 'r',
      type: 'string',
      choices: ['1:1', '16:9', '4:3'],
      default: '16:9'
    },
    {
      name: 'save',
      type: 'boolean',
      default: false
    },
    {
      name: 'quality',
      type: 'number',
      default: 80,
      min: 1,
      max: 100
    }
  ];

  const parsed = parseCommand(command, schema);
  console.log(`✅ Parsed prompt: "${parsed.prompt}"`);
  console.log(`✅ Parsed options:`, parsed.options);

  // Validate inputs
  const promptValidation = validatePrompt(parsed.prompt);
  const themeValidation = validateTheme(parsed.options.theme);
  const ratioValidation = validateAspectRatio(parsed.options.ratio);

  if (promptValidation.valid && themeValidation.valid && ratioValidation.valid) {
    console.log('✅ All validations passed');
  } else {
    console.log('❌ Validation failed');
    return;
  }

  // Demo 2: Simulate image generation
  console.log('\n🚀 Demo 2: Image Generation Simulation');
  console.log('-------------------------------------');

  console.log('🔄 Generating image...');
  const result = await simulateGeminiAPI(parsed.prompt, parsed.options);

  if (result.success) {
    console.log('✅ Image generated successfully!');
    console.log(`📊 Image data size: ${result.imageData.length} characters`);
    console.log(`🕒 Generated at: ${result.metadata.timestamp}`);

    if (parsed.options.save) {
      const filename = generateFilename(parsed.prompt, parsed.options.theme);
      const savedPath = await saveMockImage(result.imageData, filename);
      console.log(`💾 Image saved to: ${savedPath}`);
    }
  }

  // Demo 3: Multiple themes showcase
  console.log('\n🎭 Demo 3: Multiple Artistic Themes');
  console.log('------------------------------------');

  const testPrompts = [
    { prompt: 'cyberpunk city at night', theme: 'anime' },
    { prompt: 'vintage car racing', theme: 'oil-painting' },
    { prompt: 'minimalist logo design', theme: 'minimalist' },
    { prompt: 'fantasy dragon castle', theme: 'surreal' }
  ];

  for (const test of testPrompts) {
    console.log(`\n🎨 Theme: ${test.theme.toUpperCase()}`);
    console.log(`📝 Prompt: "${test.prompt}"`);

    const validation = validateTheme(test.theme);
    if (validation.valid) {
      console.log('✅ Theme validated');
      // Simulate quick generation
      await simulateGeminiAPI(test.prompt, {
        theme: test.theme,
        ratio: '1:1',
        quality: 80
      });
    } else {
      console.log('❌ Theme validation failed');
    }
  }

  // Demo 4: Error handling
  console.log('\n⚠️ Demo 4: Error Handling');
  console.log('--------------------------');

  const errorTests = [
    { prompt: '', description: 'Empty prompt' },
    { prompt: 'Hi', description: 'Too short prompt' },
    { theme: 'invalid-theme', description: 'Invalid theme' },
    { ratio: '5:4', description: 'Invalid aspect ratio' }
  ];

  errorTests.forEach(test => {
    if (test.prompt !== undefined) {
      const result = validatePrompt(test.prompt);
      console.log(`${result.valid ? '✅' : '❌'} ${test.description}: ${result.error || 'Valid'}`);
    }
    if (test.theme !== undefined) {
      const result = validateTheme(test.theme);
      console.log(`${result.valid ? '✅' : '❌'} ${test.description}: ${result.error || 'Valid'}`);
    }
    if (test.ratio !== undefined) {
      const result = validateAspectRatio(test.ratio);
      console.log(`${result.valid ? '✅' : '❌'} ${test.description}: ${result.error || 'Valid'}`);
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Demo Complete!');
  console.log('\n📋 Skill Features Demonstrated:');
  console.log('✅ Command parsing and option handling');
  console.log('✅ Input validation (prompt, theme, aspect ratio)');
  console.log('✅ Multiple artistic themes support');
  console.log('✅ Image saving functionality');
  console.log('✅ Comprehensive error handling');
  console.log('✅ Configurable quality and aspect ratios');

  console.log('\n🚀 Ready for real Gemini API integration!');
  console.log('To use with real API, ensure GEMINI_API_KEY is set and network access is available.');
}

// Run the demonstration
demonstrateSkill().catch(console.error);