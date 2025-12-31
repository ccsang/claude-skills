import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import GeminiImageClient from '../src/lib/gemini-client.js';
import { validatePrompt, validateOptions } from '../src/utils/validation.js';
import { parseCommand, generateHelpText } from '../src/utils/options.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in the skill root
const skillRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(skillRoot, '.env') });
// Also try loading from project root if not found or key missing
if (!process.env.GEMINI_API_KEY) {
    dotenv.config({ path: path.join(skillRoot, '../../.env') });
}

// Define options schema
const optionsSchema = [
    { name: 'theme', alias: 't', type: 'string', description: 'Artistic theme', choices: ['photorealistic', 'anime', 'oil-painting', 'watercolor', 'digital-art', 'sketch', 'impressionist', 'surreal', 'cyberpunk', 'fantasy', 'vintage', 'minimalist'], default: 'photorealistic' },
    { name: 'ratio', alias: 'r', type: 'string', description: 'Aspect ratio', choices: ['1:1', '4:3', '16:9', '3:2', '2:1', '9:16', '3:4'], default: '16:9' },
    { name: 'style', alias: 's', type: 'string', description: 'Additional style', default: '' },
    { name: 'quality', alias: 'q', type: 'number', description: 'Quality (1-100)', default: 80, min: 1, max: 100 },
    { name: 'save', type: 'boolean', description: 'Save to file', default: true },
    { name: 'output-dir', type: 'string', description: 'Output directory', default: './output' },
    { name: 'filename', type: 'string', description: 'Custom filename', default: null },
    { name: 'verbose', alias: 'v', type: 'boolean', description: 'Verbose output', default: false },
    { name: 'help', alias: 'h', type: 'boolean', description: 'Show help', default: false }
];

async function main() {
    try {
        const args = process.argv.slice(2);
        let { prompt, options } = parseCommand(args, optionsSchema);

        // Map kebab-case to camelCase for validation and usage
        options.outputDir = options['output-dir'];
        delete options['output-dir'];

        // Show help
        if (options.help) {
            console.log('Usage: node generate.js <prompt> [options]');
            console.log('\n' + generateHelpText(optionsSchema));
            return;
        }

        if (!prompt) {
            console.error('Error: Prompt is required.');
            console.log('Usage: node generate.js <prompt> [options]');
            process.exit(1);
        }

        // Validate prompt and options
        const promptValidation = validatePrompt(prompt);
        if (!promptValidation.valid) {
            throw new Error(promptValidation.error);
        }

        const optionsValidation = validateOptions(options);
        if (!optionsValidation.valid) {
            throw new Error(`Invalid options: ${optionsValidation.errors.join(', ')}`);
        }

        if (options.verbose) {
            console.log(`Generating image for prompt: "${prompt}"`);
            console.log(`Theme: ${options.theme}, Ratio: ${options.ratio}`);
        }

        // Initialize client
        const client = new GeminiImageClient();

        // Generate
        const result = await client.generateImage(prompt, {
            theme: options.theme,
            aspectRatio: options.ratio,
            style: options.style,
            quality: options.quality,
            save: options.save,
            outputDir: options.outputDir,
            filename: options.filename
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        // The client already saves images during generation
        if (result.images && result.images.length > 0) {
            const savedPath = result.images[0].path;
            console.log(path.resolve(savedPath));
        } else {
            console.log('No images generated.');
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();
