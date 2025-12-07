// Test script for the new Gemini Image Generator with streaming support
// Usage: node test-new-features.js

const GeminiImageClient = require('./src/lib/gemini-client');

async function testNewFeatures() {
  console.log('🚀 Testing New Gemini Image Generator Features\n');

  const client = new GeminiImageClient();

  try {
    // Test 1: Basic image generation with streaming
    console.log('📸 Test 1: Basic image generation with streaming');
    console.log('Prompt: "A cute cat wearing a colorful hat"');

    const result1 = await client.generateImage('A cute cat wearing a colorful hat', {
      theme: 'digital-art',
      imageSize: '1K',
      onProgress: (progress) => {
        if (progress.type === 'image') {
          console.log(`  ✅ Image saved: ${progress.fileName}`);
        } else if (progress.type === 'text') {
          console.log(`  📝 Text: ${progress.content.slice(0, 50)}...`);
        }
      }
    });

    if (result1.success) {
      console.log(`  🎉 Success! Generated ${result1.images.length} image(s)`);
      console.log(`  📂 Saved to: ${result1.images[0].path}`);
    } else {
      console.log(`  ❌ Error: ${result1.error}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Image generation with Google Search
    console.log('🔍 Test 2: Image generation with Google Search enabled');
    console.log('Prompt: "The latest smartphone from 2024"');

    const result2 = await client.generateImage('The latest smartphone from 2024', {
      enableGoogleSearch: true,
      theme: 'photorealistic',
      imageSize: '1K',
      onProgress: (progress) => {
        if (progress.type === 'image') {
          console.log(`  ✅ Image saved: ${progress.fileName}`);
        } else if (progress.type === 'text') {
          console.log(`  🔍 Search info: ${progress.content.slice(0, 100)}...`);
        }
      }
    });

    if (result2.success) {
      console.log(`  🎉 Success! Generated ${result2.images.length} image(s)`);
      console.log(`  📂 Saved to: ${result2.images[0].path}`);
      console.log(`  📝 Additional text: ${result2.text.slice(0, 100)}...`);
    } else {
      console.log(`  ❌ Error: ${result2.error}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Multiple themes comparison
    console.log('🎨 Test 3: Multiple themes comparison');
    console.log('Prompt: "A majestic lion in the wild"');

    const themes = ['photorealistic', 'anime', 'oil-painting'];
    for (const theme of themes) {
      console.log(`\n  🎭 Theme: ${theme}`);
      const result = await client.generateImage('A majestic lion in the wild', {
        theme: theme,
        imageSize: '1K',
        onProgress: (progress) => {
          if (progress.type === 'image') {
            console.log(`    ✅ Image saved: ${progress.fileName}`);
          }
        }
      });

      if (result.success) {
        console.log(`    🎉 Success! Saved to: ${result.images[0].path}`);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: API connection validation
    console.log('🔗 Test 4: API connection validation');
    const isValid = await client.validateConnection();
    console.log(`  Connection status: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

    console.log('\n🎉 All tests completed!');
    console.log('\n📁 Check the ./output directory for generated images.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY environment variable is required');
  console.log('\nPlease set your Gemini API key:');
  console.log('export GEMINI_API_KEY=your_api_key_here');
  process.exit(1);
}

// Run the tests
testNewFeatures().catch(console.error);