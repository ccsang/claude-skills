const { Command } = require('@claudeai/skill-sdk');
const GeminiImageClient = require('../lib/gemini-client');
const { validatePrompt, validateTheme, validateAspectRatio } = require('../utils/validation');
const { parseOptions } = require('../utils/options');

class GenerateImageCommand extends Command {
  constructor() {
    super();
    this.name = 'generate-image';
    this.description = 'Generate AI images using Google Gemini API with customizable themes and aspect ratios';
    this.usage = '/generate-image <prompt> [options]';
    this.client = new GeminiImageClient();

    this.options = [
      {
        name: 'theme',
        alias: 't',
        type: 'string',
        description: 'Artistic theme for the image',
        choices: ['photorealistic', 'anime', 'oil-painting', 'watercolor', 'digital-art', 'sketch', 'impressionist', 'surreal', 'cyberpunk', 'fantasy', 'vintage', 'minimalist'],
        default: 'photorealistic'
      },
      {
        name: 'ratio',
        alias: 'r',
        type: 'string',
        description: 'Aspect ratio of the image',
        choices: ['1:1', '4:3', '16:9', '3:2', '2:1', '9:16', '3:4'],
        default: '16:9'
      },
      {
        name: 'style',
        alias: 's',
        type: 'string',
        description: 'Additional style description',
        default: ''
      },
      {
        name: 'quality',
        alias: 'q',
        type: 'number',
        description: 'Image quality (1-100)',
        default: 80,
        min: 1,
        max: 100
      },
      {
        name: 'save',
        type: 'boolean',
        description: 'Save the generated image to file',
        default: false
      },
      {
        name: 'output-dir',
        type: 'string',
        description: 'Output directory for saved images',
        default: './output'
      },
      {
        name: 'filename',
        type: 'string',
        description: 'Custom filename (without extension)',
        default: null
      },
      {
        name: 'verbose',
        alias: 'v',
        type: 'boolean',
        description: 'Enable verbose output',
        default: false
      }
    ];
  }

  async execute(args, options = {}) {
    try {
      // Parse and validate arguments
      const { prompt, parsedOptions } = this.parseArguments(args, options);

      if (parsedOptions.verbose) {
        console.log('🎨 Gemini Image Generator');
        console.log('========================');
        console.log(`Prompt: ${prompt}`);
        console.log(`Theme: ${parsedOptions.theme}`);
        console.log(`Aspect Ratio: ${parsedOptions.ratio}`);
        console.log(`Quality: ${parsedOptions.quality}`);
        console.log('');
      }

      // Validate inputs
      const promptValidation = validatePrompt(prompt);
      if (!promptValidation.valid) {
        throw new Error(`Invalid prompt: ${promptValidation.error}`);
      }

      const themeValidation = validateTheme(parsedOptions.theme);
      if (!themeValidation.valid) {
        throw new Error(`Invalid theme: ${themeValidation.error}`);
      }

      const ratioValidation = validateAspectRatio(parsedOptions.ratio);
      if (!ratioValidation.valid) {
        throw new Error(`Invalid aspect ratio: ${ratioValidation.error}`);
      }

      // Generate the image
      if (parsedOptions.verbose) {
        console.log('🚀 Generating image...');
      }

      const result = await this.client.generateImage(prompt, {
        theme: parsedOptions.theme,
        aspectRatio: parsedOptions.ratio,
        style: parsedOptions.style,
        quality: parsedOptions.quality
      });

      if (!result.success) {
        throw new Error(`Image generation failed: ${result.error}`);
      }

      // Handle image saving if requested
      let savedPath = null;
      if (parsedOptions.save) {
        if (parsedOptions.verbose) {
          console.log('💾 Saving image...');
        }

        const filename = parsedOptions.filename ||
          this.client.generateFilename(prompt, parsedOptions.theme);

        savedPath = await this.client.saveImage(
          result.imageData,
          filename,
          parsedOptions.outputDir
        );

        if (parsedOptions.verbose) {
          console.log(`✅ Image saved to: ${savedPath}`);
        }
      }

      // Return success response
      const response = {
        success: true,
        message: 'Image generated successfully!',
        data: {
          prompt: prompt,
          theme: parsedOptions.theme,
          aspectRatio: parsedOptions.ratio,
          quality: parsedOptions.quality,
          imageData: result.imageData,
          savedPath: savedPath,
          metadata: result.metadata
        },
        timestamp: new Date().toISOString()
      };

      if (parsedOptions.verbose) {
        console.log('✨ Image generation complete!');
        if (!parsedOptions.save) {
          console.log('💡 Tip: Use --save option to save the image to a file');
        }
      }

      return response;

    } catch (error) {
      console.error('❌ Error in generate-image command:', error.message);

      return {
        success: false,
        error: error.message,
        usage: this.usage,
        examples: [
          `${this.usage} a serene mountain landscape at sunset --theme photorealistic --ratio 16:9`,
          `${this.usage} abstract cyberpunk city --theme anime --ratio 1:1 --save`,
          `${this.usage} vintage car on country road --theme oil-painting --ratio 4:3 --save --output-dir ./my-images`
        ],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Parse arguments and options
   * @param {Array|String} args - Command arguments
   * @param {Object} options - Parsed options
   * @returns {Object} Parsed prompt and options
   */
  parseArguments(args, options) {
    let prompt = '';

    if (typeof args === 'string') {
      prompt = args;
    } else if (Array.isArray(args)) {
      prompt = args.join(' ');
    } else if (args && typeof args.prompt === 'string') {
      prompt = args.prompt;
    }

    // Use defaults from skill.json if environment variables are set
    const parsedOptions = {
      theme: options.theme || process.env.DEFAULT_THEME || 'photorealistic',
      ratio: options.ratio || process.env.DEFAULT_RATIO || '16:9',
      style: options.style || '',
      quality: options.quality || 80,
      save: options.save || false,
      outputDir: options.outputDir || './output',
      filename: options.filename || null,
      verbose: options.verbose || process.env.DEBUG_MODE === 'true'
    };

    return { prompt, parsedOptions };
  }

  /**
   * Get help information
   * @returns {Object} Help information
   */
  getHelp() {
    return {
      name: this.name,
      description: this.description,
      usage: this.usage,
      options: this.options.map(opt => ({
        name: opt.name,
        alias: opt.alias,
        type: opt.type,
        description: opt.description,
        default: opt.default,
        choices: opt.choices
      })),
      examples: [
        'Generate a realistic landscape:',
        '  /generate-image a serene mountain landscape at sunset --theme photorealistic --ratio 16:9',
        '',
        'Generate anime-style portrait:',
        '  /generate-image futuristic cyberpunk character --theme anime --ratio 1:1 --save',
        '',
        'Generate artistic painting:',
        '  /generate-image vintage car on country road --theme oil-painting --ratio 4:3 --save --output-dir ./artwork'
      ],
      themes: [
        'photorealistic', 'anime', 'oil-painting', 'watercolor', 'digital-art',
        'sketch', 'impressionist', 'surreal', 'cyberpunk', 'fantasy', 'vintage', 'minimalist'
      ],
      aspectRatios: ['1:1', '4:3', '16:9', '3:2', '2:1', '9:16', '3:4']
    };
  }
}

module.exports = GenerateImageCommand;