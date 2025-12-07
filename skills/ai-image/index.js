const { Skill } = require('@claudeai/skill-sdk');
const GenerateImageCommand = require('./src/commands/generate-image');

class GeminiImageGeneratorSkill extends Skill {
  constructor() {
    super();
    this.name = 'ai-image';
    this.version = '1.0.0';
  }

  async initialize() {
    // Validate required environment variables
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    // Register the generate-image command
    this.registerCommand('generate-image', new GenerateImageCommand());

    console.log(`${this.name} v${this.version} initialized successfully`);
    console.log('Supported themes:', this.getSupportedThemes().join(', '));
    console.log('Supported aspect ratios:', this.getSupportedRatios().join(', '));
  }

  async shutdown() {
    console.log(`${this.name} shutting down`);
  }

  getSupportedThemes() {
    const skillConfig = require('./skill.json');
    return skillConfig.config.supportedThemes;
  }

  getSupportedRatios() {
    const skillConfig = require('./skill.json');
    return skillConfig.config.supportedRatios;
  }
}

module.exports = GeminiImageGeneratorSkill;