# Gemini Image Generator - Streaming Features

## 🚀 New Features Overview

This update brings powerful new capabilities based on the latest Gemini API:

- ✅ **Streaming Support**: Real-time image and text generation
- ✅ **Google Search Integration**: Enhanced prompts with up-to-date information
- ✅ **Multiple Output Formats**: Support for different image formats
- ✅ **Progress Callbacks**: Track generation progress in real-time
- ✅ **Advanced Configuration**: Fine-tune image generation parameters

## 📦 Dependencies Update

Make sure to install the new dependencies:

```bash
npm install @google/genai mime
```

## 🔧 API Changes

### New Model
- Updated to `gemini-3-pro-image-preview` for better image generation quality

### Enhanced generateImage() Method

```javascript
const result = await client.generateImage(prompt, {
  // Original options (still supported)
  theme: 'photorealistic',           // Artistic theme
  aspectRatio: '16:9',              // Aspect ratio
  style: 'cinematic lighting',      // Additional style
  quality: 80,                      // Quality factor

  // New options
  enableGoogleSearch: true,         // Enable Google Search tool
  imageSize: '1K',                  // Image size ('1K', '2K', etc.)
  onProgress: (progress) => {       // Real-time progress callback
    if (progress.type === 'image') {
      console.log(`Image saved: ${progress.fileName}`);
    } else if (progress.type === 'text') {
      console.log(`Text: ${progress.content}`);
    }
  }
});
```

## 📋 Progress Callback Format

The `onProgress` callback receives progress updates during generation:

```javascript
onProgress: (progress) => {
  // Image generation progress
  if (progress.type === 'image') {
    console.log(`Generated image: ${progress.fileName}`);
    console.log(`Saved to: ${progress.path}`);
    console.log(`Index: ${progress.index}`);
  }

  // Text generation progress
  else if (progress.type === 'text') {
    console.log(`Generated text: ${progress.content}`);
  }
}
```

## 🎯 Response Format Changes

The response structure has been enhanced:

```javascript
{
  success: true,
  images: [
    {
      path: './output/generated_image_0.png',
      mimeType: 'image/png',
      data: 'base64-encoded-image-data'
    }
    // ... more images if generated
  ],
  text: 'Additional text content from the generation',
  metadata: {
    prompt: 'enhanced prompt',
    theme: 'photorealistic',
    aspectRatio: '16:9',
    quality: 80,
    imageSize: '1K',
    enableGoogleSearch: true,
    model: 'gemini-3-pro-image-preview',
    timestamp: '2024-01-01T00:00:00.000Z'
  }
}
```

## 🔍 Google Search Integration

Enable Google Search to enhance prompts with current information:

```javascript
const result = await client.generateImage(
  'The latest iPhone model released in 2024',
  {
    enableGoogleSearch: true,
    theme: 'photorealistic',
    onProgress: (progress) => {
      if (progress.type === 'text') {
        console.log('Search results:', progress.content);
      }
    }
  }
);
```

## 🎨 Supported Image Sizes

- `'1K'` - Standard resolution (default)
- `'2K'` - Higher resolution
- Additional sizes may be supported by the API

## 🧪 Testing the New Features

Run the test script to see all new features in action:

```bash
# Set your API key first
export GEMINI_API_KEY=your_api_key_here

# Run the test script
node test-new-features.js
```

The test script demonstrates:
1. Basic streaming image generation
2. Google Search integration
3. Multiple themes comparison
4. API connection validation

## 📁 Output Directory

Generated images are automatically saved to `./output/` directory with descriptive filenames:
- `generated_image_0.png`
- `generated_image_1.png`
- etc.

## 🔧 Backward Compatibility

The update maintains backward compatibility:

- Existing `saveImage()` method still works
- Original options are still supported
- Enhanced `saveImageBuffer()` method for direct buffer saving

## 🚨 Migration Notes

If you're upgrading from the previous version:

1. **Update dependencies**: `npm install @google/genai mime`
2. **Update imports**: Use `@google/genai` instead of `@google/generative-ai`
3. **Update response handling**: Check for `images` array instead of single `imageData`
4. **Consider using callbacks**: Add `onProgress` for better user experience

## 🐛 Troubleshooting

### Common Issues

1. **Module not found**: Make sure to install new dependencies
2. **API errors**: Verify your `GEMINI_API_KEY` is correct and valid
3. **No images generated**: Check if the model supports image generation for your prompt

### Debug Mode

Enable detailed logging by checking the console output during generation.

## 📚 Example Usage

### Basic Streaming
```javascript
const client = new GeminiImageClient();

const result = await client.generateImage('A beautiful sunset', {
  theme: 'photorealistic',
  onProgress: (progress) => {
    console.log('Progress:', progress);
  }
});

console.log('Generated images:', result.images);
```

### Advanced Configuration
```javascript
const result = await client.generateImage(
  'Futuristic city skyline at night',
  {
    theme: 'cyberpunk',
    aspectRatio: '16:9',
    style: 'neon lights, flying cars',
    quality: 90,
    enableGoogleSearch: true,
    imageSize: '1K',
    onProgress: (progress) => {
      if (progress.type === 'image') {
        console.log(`✅ ${progress.fileName} saved!`);
      }
    }
  }
);
```

Enjoy the enhanced image generation capabilities! 🎉