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
- `--theme <theme>`: Artistic theme (default: `photorealistic`). See [Available Styles](#available-styles) below.
- `--ratio <ratio>`: Aspect ratio (default: `16:9`).
  - Supported: `1:1`, `4:3`, `16:9`, `3:2`, `2:1`, `9:16`, `3:4` or any custom ratio (e.g. `21:9`).
- `--style <style>`: Additional style parameters to refine the output.
- `--quality <level>`: Quality factor (1-100).
- `--number <count>`: Number of images to generate (default: `1`).
- `--save`: Save generated image to file (default: `true`).
- `--output-dir <path>`: Directory to save image (default: `./output`).
- `--filename <name>`: Custom filename (without extension).

## Available Styles
The `ai-image` skill supports a variety of artistic themes to suit your needs. Use the `--theme` flag to select one.

- **`photorealistic`**: Lifelike images with realistic lighting, textures, and details. Best for simulating photography.
- **`anime`**: Japanese animation style with distinct character designs and vibrant colors.
- **`oil-painting`**: Classic oil painting aesthetic with visible brushstrokes and rich textures.
- **`watercolor`**: Soft, fluid, and translucent effects mimicking traditional watercolor painting.
- **`digital-art`**: Modern, crisp digital illustration style often found on ArtStation or DevianArt.
- **`sketch`**: Rough or polished pencil/charcoal sketches, focusing on lines and shading.
- **`impressionist`**: Captures the feeling of a scene with loose brushwork and light interaction (e.g., Monet style).
- **`surreal`**: Dream-like, illogical, and imaginative scenes often combining unrelated elements.
- **`cyberpunk`**: Futuristic, high-tech, low-life aesthetic with neon lights and urban decay.
- **`fantasy`**: Magical, mythical, and fairy-tale themes suitable for RPGs or story illustrations.
- **`vintage`**: Retro, old-school photography or art styles (e.g., sepia tones, film grain).
- **`minimalist`**: Simple, clean, and uncluttered designs with focus on negative space and core elements.
- **`hand-drawn`**: Minimalist graphite sketch on rough paper, emphasizing organic lines, texture, and negative space.
- **`comic-sketch`**: Minimalist black and white comic manuscript style, distinct for its raw, expressionist sketches and multi-panel layout.
- **`shin-hanga`**: 20th-century Japanese "New Print" style, blending traditional Ukiyo-e woodblock aesthetics with Western impressionist light and mood.
- **`swiss-tech`**: Swiss Style technical deconstruction illustration, featuring orthographic views, black/white/red color scheme, and vintage plotting paper background.

## File Management
Proper file management is crucial for keeping your generated assets organized.

- **`--save`**: Ensure this is enabled (default) to persist your creations.
- **`--output-dir`**: **Important!** Use this to group related images. For example, if you are generating assets for a specific blog post or project, specify a dedicated folder (e.g., `--output-dir ./assets/blog-post-1`).
- **`--filename`**: **Recommended!** By default, filenames are generated based on the prompt, which can be long and unwieldy. Specify a concise, meaningful filename to make it easier to reference the image later (e.g., `--filename hero-image`).

## Examples

**1. Basic Photorealistic Landscape**
```bash
ai-image "a serene mountain landscape at sunset" --theme photorealistic --ratio 16:9
```

**2. Project Asset with Custom Path and Name**
```bash
# Saves to ./projects/sci-fi/background.png
ai-image "futuristic laboratory interior" \
  --theme cyberpunk \
  --output-dir ./projects/sci-fi \
  --filename background
```

**3. Character Portrait in Anime Style**
```bash
ai-image "female warrior with magic staff" --theme anime --ratio 3:4 --quality 90
```

**4. Artistic Concept Art**
```bash
ai-image "floating island in the sky" --theme fantasy --style "dramatic lighting" --filename concept-art-01
```

## Requirements
- `GEMINI_API_KEY`: Environment variable required.

## Configuration
- **Supported Themes**: See [Available Styles](#available-styles) list above.
- **Supported Ratios**: `1:1`, `4:3`, `16:9`, `3:2`, `2:1`, `9:16`, `3:4` or any custom `W:H` ratio.
