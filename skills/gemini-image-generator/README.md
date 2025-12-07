# Gemini Image Generator Claude Code Skill

A powerful Claude Code skill that generates high-quality AI images using Google's Gemini API with customizable aspect ratios and artistic themes.

## Features

- 🎨 **Multiple Artistic Themes**: Choose from photorealistic, anime, oil painting, watercolor, digital art, sketch, impressionist, surreal, cyberpunk, fantasy, vintage, and minimalist styles
- 📐 **Customizable Aspect Ratios**: Support for 1:1, 4:3, 16:9, 3:2, 2:1, 9:16, and 3:4 aspect ratios
- 💾 **Image Saving**: Option to save generated images to local files
- 🔒 **Input Validation**: Comprehensive validation for prompts, themes, and options
- 📊 **Verbose Mode**: Detailed output for debugging and monitoring
- 🎯 **High Quality**: Configurable image quality settings

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   export GEMINI_API_KEY="your_gemini_api_key_here"
   ```

   Optional environment variables:
   ```bash
   export DEBUG_MODE="true"           # Enable verbose output
   export DEFAULT_THEME="photorealistic"  # Default artistic theme
   export DEFAULT_RATIO="16:9"        # Default aspect ratio
   ```

3. **Register the skill with Claude Code:**
   Follow your Claude Code configuration to add this skill to your environment.

## Usage

### Basic Command

```bash
/generate-image "a serene mountain landscape at sunset"
```

### Advanced Usage with Options

```bash
/generate-image "futuristic cyberpunk city" --theme anime --ratio 16:9 --save
```

### Command Options

| Option | Alias | Type | Description | Default | Choices |
|--------|-------|------|-------------|---------|---------|
| `--theme` | `-t` | string | Artistic theme for the image | `photorealistic` | See themes below |
| `--ratio` | `-r` | string | Aspect ratio of the image | `16:9` | See ratios below |
| `--style` | `-s` | string | Additional style description | `""` | Any text |
| `--quality` | `-q` | number | Image quality (1-100) | `80` | 1-100 |
| `--save` | | boolean | Save the generated image to file | `false` | |
| `--output-dir` | | string | Output directory for saved images | `./output` | |
| `--filename` | | string | Custom filename (without extension) | Auto-generated | |
| `--verbose` | `-v` | boolean | Enable verbose output | `false` | |

### Supported Themes

- `photorealistic` - Highly detailed, professional photography
- `anime` - Japanese animation style with vibrant colors
- `oil-painting` - Classical art with visible brush strokes
- `watercolor` - Soft, transparent colors with artistic effects
- `digital-art` - Clean, modern digital illustration
- `sketch` - Pencil or charcoal drawing with detailed line work
- `impressionist` - Loose brush strokes with play of light
- `surreal` - Dreamlike and imaginative artwork
- `cyberpunk` - Neon-colored futuristic sci-fi aesthetic
- `fantasy` - Magical, ethereal, and mythical themes
- `vintage` - Retro, aged, classic artistic style
- `minimalist` - Clean, simple design with essential elements

### Supported Aspect Ratios

- `1:1` - Square format (perfect for profile pictures)
- `16:9` - Widescreen landscape (cinematic)
- `4:3` - Standard format (traditional)
- `3:2` - Photography standard
- `2:1` - Panoramic wide format
- `9:16` - Vertical portrait (mobile stories)
- `3:4` - Vertical portrait format

## Examples

### 1. Generate a realistic landscape
```bash
/generate-image "a serene mountain landscape at sunset" --theme photorealistic --ratio 16:9
```

### 2. Create anime-style character art
```bash
/generate-image "futuristic cyberpunk character" --theme anime --ratio 1:1 --save
```

### 3. Generate artistic painting
```bash
/generate-image "vintage car on country road" --theme oil-painting --ratio 4:3 --save --output-dir ./artwork
```

### 4. Create surreal abstract art
```bash
/generate-image "abstract geometric patterns" --theme surreal --ratio 1:1 --style "vibrant colors, flowing shapes" --save
```

### 5. Generate minimalist design
```bash
/generate-image "clean geometric logo" --theme minimalist --ratio 1:1 --quality 100 --save
```

## Output

### Successful Generation
```json
{
  "success": true,
  "message": "Image generated successfully!",
  "data": {
    "prompt": "serene mountain landscape at sunset",
    "theme": "photorealistic",
    "aspectRatio": "16:9",
    "quality": 80,
    "imageData": "base64_encoded_image_data...",
    "savedPath": "./output/mountain-landscape-photorealistic-2024-01-15T10-30-45-123Z.png",
    "metadata": {
      "timestamp": "2024-01-15T10:30:45.123Z",
      "model": "gemini-2.0-flash-exp-image-generation"
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid prompt: Prompt cannot be empty",
  "usage": "/generate-image <prompt> [options]",
  "examples": [...],
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## Error Handling

The skill includes comprehensive error handling for:

- **Invalid prompts**: Empty, too short, or potentially harmful content
- **Invalid themes**: Unsupported or misspelled theme names
- **Invalid aspect ratios**: Unsupported ratio formats
- **API errors**: Gemini API connection issues, rate limits, or generation failures
- **File system errors**: Permission issues or invalid paths when saving images
- **Configuration errors**: Missing API keys or invalid environment variables

## Environment Variables

### Required
- `GEMINI_API_KEY` - Your Google Gemini API key

### Optional
- `DEBUG_MODE` - Set to "true" for verbose output
- `DEFAULT_THEME` - Default artistic theme (defaults to "photorealistic")
- `DEFAULT_RATIO` - Default aspect ratio (defaults to "16:9")

## API Integration

This skill uses Google's Gemini API with the `gemini-2.0-flash-exp-image-generation` model for high-quality image generation. The API enhances prompts with appropriate artistic modifiers and style guidelines based on your selected theme and aspect ratio.

## File Structure

```
gemini-image-generator/
├── skill.json              # Skill configuration
├── index.js               # Main skill entry point
├── package.json           # Node.js dependencies
├── README.md             # This documentation
├── src/
│   ├── commands/
│   │   └── generate-image.js  # Main command handler
│   ├── lib/
│   │   └── gemini-client.js   # Gemini API client
│   └── utils/
│       ├── validation.js      # Input validation
│       └── options.js         # Option parsing
└── output/               # Default image output directory
```

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```
   Error: GEMINI_API_KEY environment variable is required
   ```
   Solution: Set the `GEMINI_API_KEY` environment variable.

2. **Invalid Theme**
   ```
   Error: Invalid theme "invalid-theme". Valid themes are: photorealistic, anime, oil-painting...
   ```
   Solution: Use one of the supported themes listed above.

3. **Prompt Too Long**
   ```
   Error: Prompt must be less than 1000 characters long
   ```
   Solution: Shorten your prompt or use more concise language.

4. **File Save Error**
   ```
   Error: Failed to save image: Permission denied
   ```
   Solution: Ensure you have write permissions to the output directory or specify a different directory with `--output-dir`.

### Debug Mode

Enable verbose output for detailed debugging information:

```bash
/generate-image "test prompt" --verbose
```

Or set the environment variable:

```bash
export DEBUG_MODE="true"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Enable debug mode for detailed error information
3. Review the Google Gemini API documentation for any API-specific issues

## Acknowledgments

- Google for the Gemini AI image generation capabilities
- Claude Code for the skill framework and development tools