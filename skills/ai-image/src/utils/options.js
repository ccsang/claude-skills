/**
 * Options parsing utilities for the Gemini Image Generator skill
 */

/**
 * Parse command line options and arguments
 * @param {Array|String} args - Raw arguments
 * @param {Object} defaults - Default option values
 * @returns {Object} Parsed options
 */
function parseOptions(args, defaults = {}) {
  const options = { ...defaults };

  if (typeof args === 'string') {
    args = args.split(' ');
  }

  if (!Array.isArray(args)) {
    return options;
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Handle long options (--option=value or --option value)
    if (arg.startsWith('--')) {
      const [optionName, optionValue] = parseLongOption(arg, args[i + 1]);
      options[optionName] = optionValue;
      if (optionValue === undefined && args[i + 1] && !args[i + 1].startsWith('-')) {
        i++; // Skip the next argument as it's the value
      }
    }
    // Handle short options (-o value or -o=value)
    else if (arg.startsWith('-') && !arg.startsWith('--')) {
      const [optionName, optionValue] = parseShortOption(arg, args[i + 1]);
      options[optionName] = optionValue;
      if (optionValue === undefined && args[i + 1] && !args[i + 1].startsWith('-')) {
        i++; // Skip the next argument as it's the value
      }
    }
  }

  return options;
}

/**
 * Parse a long option (e.g., --theme=anime or --theme anime)
 * @param {string} arg - The option argument
 * @param {string} nextArg - The next argument (might be the value)
 * @returns {Array} [optionName, optionValue]
 */
function parseLongOption(arg, nextArg) {
  const parts = arg.substring(2).split('=', 2);
  const optionName = parts[0];

  if (parts.length === 2) {
    // Format: --option=value
    return [optionName, parseOptionValue(parts[1])];
  } else {
    // Format: --option value (value is in nextArg)
    if (nextArg && !nextArg.startsWith('-')) {
      return [optionName, parseOptionValue(nextArg)];
    } else {
      // Boolean flag
      return [optionName, true];
    }
  }
}

/**
 * Parse a short option (e.g., -t anime or -t=anime)
 * @param {string} arg - The option argument
 * @param {string} nextArg - The next argument (might be the value)
 * @returns {Array} [optionName, optionValue]
 */
function parseShortOption(arg, nextArg) {
  const flag = arg.substring(1);
  const parts = flag.split('=', 2);
  const optionName = parts[0];

  if (parts.length === 2) {
    // Format: -o=value
    return [optionName, parseOptionValue(parts[1])];
  } else {
    // Format: -o value (value is in nextArg)
    if (nextArg && !nextArg.startsWith('-')) {
      return [optionName, parseOptionValue(nextArg)];
    } else {
      // Boolean flag
      return [optionName, true];
    }
  }
}

/**
 * Parse option value with type conversion
 * @param {string} value - The raw value
 * @returns {*} Parsed value (string, number, or boolean)
 */
function parseOptionValue(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const stringValue = value.toString().trim();

  // Boolean values
  if (stringValue.toLowerCase() === 'true') return true;
  if (stringValue.toLowerCase() === 'false') return false;

  // Numeric values
  if (!isNaN(stringValue) && stringValue !== '') {
    const num = Number(stringValue);
    if (Number.isInteger(num)) {
      return num;
    }
    return num;
  }

  return stringValue;
}

/**
 * Extract prompt from arguments (non-option arguments)
 * @param {Array} args - Raw arguments
 * @returns {string} The prompt string
 */
function extractPrompt(args) {
  if (!Array.isArray(args)) {
    return '';
  }

  const promptParts = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Skip options and their values
    if (arg.startsWith('-')) {
      if (arg.startsWith('--')) {
        const parts = arg.substring(2).split('=', 2);
        if (parts.length === 1 && !args[i + 1]?.startsWith('-')) {
          i++; // Skip the value
        }
      } else {
        const flag = arg.substring(1);
        const parts = flag.split('=', 2);
        if (parts.length === 1 && !args[i + 1]?.startsWith('-')) {
          i++; // Skip the value
        }
      }
    } else {
      // This is part of the prompt
      promptParts.push(arg);
    }
  }

  return promptParts.join(' ').trim();
}

/**
 * Validate and sanitize options based on a schema
 * @param {Object} options - Parsed options
 * @param {Array} schema - Option schema
 * @returns {Object} Validated and sanitized options
 */
function validateOptionsSchema(options, schema) {
  const validated = {};

  for (const optionDef of schema) {
    const name = optionDef.name;
    const value = options[name];

    if (value !== undefined) {
      // Type conversion and validation
      if (optionDef.type === 'boolean') {
        validated[name] = Boolean(value);
      } else if (optionDef.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`Option --${name} must be a number`);
        }
        if (optionDef.min !== undefined && num < optionDef.min) {
          throw new Error(`Option --${name} must be at least ${optionDef.min}`);
        }
        if (optionDef.max !== undefined && num > optionDef.max) {
          throw new Error(`Option --${name} must be at most ${optionDef.max}`);
        }
        validated[name] = num;
      } else if (optionDef.type === 'string') {
        validated[name] = String(value);
        if (optionDef.choices && !optionDef.choices.includes(validated[name])) {
          throw new Error(`Option --${name} must be one of: ${optionDef.choices.join(', ')}`);
        }
      } else {
        validated[name] = value;
      }
    } else if (optionDef.default !== undefined) {
      validated[name] = optionDef.default;
    }
  }

  return validated;
}

/**
 * Parse complete command with schema validation
 * @param {Array|String} args - Command arguments
 * @param {Array} schema - Option schema
 * @returns {Object} { prompt, options }
 */
function parseCommand(args, schema) {
  if (typeof args === 'string') {
    args = args.split(' ');
  }

  // Extract prompt first
  const prompt = extractPrompt(args);

  // Parse options
  const rawOptions = parseOptions(args);

  // Validate against schema
  const options = validateOptionsSchema(rawOptions, schema);

  return { prompt, options };
}

/**
 * Generate help text from schema
 * @param {Array} schema - Option schema
 * @returns {string} Help text
 */
function generateHelpText(schema) {
  let help = 'Options:\n';

  for (const option of schema) {
    const names = [];
    if (option.name) {
      names.push(`--${option.name}`);
    }
    if (option.alias) {
      names.push(`-${option.alias}`);
    }

    const typeInfo = option.type ? ` (${option.type})` : '';
    const choicesInfo = option.choices ? ` [${option.choices.join('|')}]` : '';
    const defaultInfo = option.default !== undefined ? ` [default: ${option.default}]` : '';

    help += `  ${names.join(', ')}${typeInfo}${choicesInfo}${defaultInfo}\n`;
    help += `    ${option.description}\n`;
  }

  return help;
}

export {
  parseOptions,
  parseLongOption,
  parseShortOption,
  parseOptionValue,
  extractPrompt,
  validateOptionsSchema,
  parseCommand,
  generateHelpText
};