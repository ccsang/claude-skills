/**
 * Test suite for Gemini Image Generator Skill
 */

import { validatePrompt, validateTheme, validateAspectRatio, validateOptions } from '../src/utils/validation.js';
import { parseOptions, extractPrompt, parseCommand } from '../src/utils/options.js';

describe('Validation Utils', () => {
  describe('validatePrompt', () => {
    test('should accept valid prompts', () => {
      const result = validatePrompt('A beautiful sunset over mountains');
      expect(result.valid).toBe(true);
    });

    test('should reject empty prompts', () => {
      const result = validatePrompt('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Prompt is required');
    });

    test('should reject short prompts', () => {
      const result = validatePrompt('Hi');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3 characters');
    });

    test('should reject too long prompts', () => {
      const longPrompt = 'A'.repeat(1001);
      const result = validatePrompt(longPrompt);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('less than 1000 characters');
    });

    test('should reject potentially harmful content', () => {
      const result = validatePrompt('violent scene with weapons');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('harmful content');
    });
  });

  describe('validateTheme', () => {
    test('should accept valid themes', () => {
      const validThemes = ['photorealistic', 'anime', 'oil-painting'];
      validThemes.forEach(theme => {
        const result = validateTheme(theme);
        expect(result.valid).toBe(true);
      });
    });

    test('should reject invalid themes', () => {
      const result = validateTheme('invalid-theme');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid theme');
    });

    test('should be case insensitive', () => {
      const result = validateTheme('PHOTOREALISTIC');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateAspectRatio', () => {
    test('should accept valid aspect ratios', () => {
      const validRatios = ['1:1', '16:9', '4:3'];
      validRatios.forEach(ratio => {
        const result = validateAspectRatio(ratio);
        expect(result.valid).toBe(true);
      });
    });

    test('should reject invalid aspect ratios', () => {
      const result = validateAspectRatio('5:4');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid aspect ratio');
    });
  });
});

describe('Options Utils', () => {
  describe('parseOptions', () => {
    test('should parse long options', () => {
      const args = ['--theme', 'anime', '--ratio', '1:1'];
      const options = parseOptions(args);
      expect(options.theme).toBe('anime');
      expect(options.ratio).toBe('1:1');
    });

    test('should parse options with equals sign', () => {
      const args = ['--theme=anime', '--ratio=1:1'];
      const options = parseOptions(args);
      expect(options.theme).toBe('anime');
      expect(options.ratio).toBe('1:1');
    });

    test('should parse short options', () => {
      const args = ['-t', 'anime', '-r', '1:1'];
      const options = parseOptions(args);
      expect(options.t).toBe('anime');
      expect(options.r).toBe('1:1');
    });

    test('should parse boolean flags', () => {
      const args = ['--save', '--verbose'];
      const options = parseOptions(args);
      expect(options.save).toBe(true);
      expect(options.verbose).toBe(true);
    });
  });

  describe('extractPrompt', () => {
    test('should extract prompt from arguments', () => {
      const args = ['beautiful', 'sunset', '--theme', 'anime', '--save'];
      const prompt = extractPrompt(args);
      expect(prompt).toBe('beautiful sunset');
    });

    test('should handle empty prompt', () => {
      const args = ['--theme', 'anime', '--save'];
      const prompt = extractPrompt(args);
      expect(prompt).toBe('');
    });
  });

  describe('parseCommand', () => {
    const schema = [
      {
        name: 'theme',
        alias: 't',
        type: 'string',
        choices: ['photorealistic', 'anime'],
        default: 'photorealistic'
      },
      {
        name: 'save',
        type: 'boolean',
        default: false
      }
    ];

    test('should parse complete command', () => {
      const args = ['beautiful sunset', '--theme', 'anime', '--save'];
      const result = parseCommand(args, schema);
      expect(result.prompt).toBe('beautiful sunset');
      expect(result.options.theme).toBe('anime');
      expect(result.options.save).toBe(true);
    });

    test('should use defaults when options not provided', () => {
      const args = ['beautiful sunset'];
      const result = parseCommand(args, schema);
      expect(result.prompt).toBe('beautiful sunset');
      expect(result.options.theme).toBe('photorealistic');
      expect(result.options.save).toBe(false);
    });
  });
});

describe('Integration Tests', () => {
  describe('validateOptions integration', () => {
    test('should validate complete options set', () => {
      const options = {
        theme: 'photorealistic',
        ratio: '16:9',
        quality: 85,
        save: true,
        outputDir: './images',
        filename: 'test-image'
      };

      const result = validateOptions(options);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should collect all validation errors', () => {
      const options = {
        theme: 'invalid-theme',
        ratio: '5:4',
        quality: 150,
        save: true,
        outputDir: '../etc/passwd',  // Dangerous path
        filename: 'CON'  // Reserved name
      };

      const result = validateOptions(options);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});