---
name: ai-image
description: Generate high-quality AI images using Google's Gemini API with customizable aspect ratios and artistic themes.
---
# AI Image Generator Skill

## Description
Generate high-quality AI images using Google's Gemini API with customizable aspect ratios and artistic themes.


## Usage
To generate an image, run the `ai-image` command.

**Syntax**:
```bash
ai-image "<prompt>" [options]
```

**Options**:
- `--theme <theme>`: Artistic theme (default: `photorealistic`).
  - Supported: `photorealistic`, `anime`, `oil-painting`, `watercolor`, `digital-art`, `sketch`, `impressionist`, `surreal`, `cyberpunk`, `fantasy`, `vintage`, `minimalist`.
- `--ratio <ratio>`: Aspect ratio (default: `16:9`).
  - Supported: `1:1`, `4:3`, `16:9`, `3:2`, `2:1`, `9:16`, `3:4`.
- `--style <style>`: Additional style parameters.
- `--quality <level>`: Quality factor (1-100).
- `--save`: Save to file (default: `true`).
- `--output-dir <path>`: Directory to save image (default: `./output`).
- `--filename <name>`: Custom filename.

**Examples**:
```bash
ai-image "a serene mountain landscape" --theme photorealistic --ratio 16:9
ai-image "cyberpunk city" --theme anime --ratio 1:1 --output-dir ./my-images
```

**Output**:
The script prints the absolute path of the generated image to standard output upon success.

## Requirements
- `GEMINI_API_KEY`: Environment variable required.

## Configuration
- Supported Themes: `photorealistic`, `anime`, `oil-painting`, `watercolor`, `digital-art`, `sketch`, `impressionist`, `surreal`, `cyberpunk`, `fantasy`, `vintage`, `minimalist`.
- Supported Ratios: `1:1`, `4:3`, `16:9`, `3:2`, `2:1`, `9:16`, `3:4`.
