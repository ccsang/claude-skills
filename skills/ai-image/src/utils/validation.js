/**
 * Validation utilities for the Gemini Image Generator skill
 */

/**
 * Validate image generation prompt
 * @param {string} prompt - The prompt to validate
 * @returns {Object} Validation result with valid flag and error message
 */
function validatePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return {
      valid: false,
      error: 'Prompt is required and must be a string'
    };
  }

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    return {
      valid: false,
      error: 'Prompt cannot be empty'
    };
  }

  if (trimmedPrompt.length < 3) {
    return {
      valid: false,
      error: 'Prompt must be at least 3 characters long'
    };
  }

  if (trimmedPrompt.length > 1000) {
    return {
      valid: false,
      error: 'Prompt must be less than 1000 characters long'
    };
  }

  // Check for potentially harmful content
  const forbiddenPatterns = [
    /violence/i,
    /hate/i,
    /terrorism/i,
    /illegal/i,
    /harmful/i,
    /dangerous/i,
    /weapon/i,
    /explosive/i
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(trimmedPrompt)) {
      return {
        valid: false,
        error: `Prompt contains potentially harmful content: ${pattern.source}`
      };
    }
  }

  return { valid: true };
}

/**
 * Validate artistic theme
 * @param {string} theme - The theme to validate
 * @returns {Object} Validation result with valid flag and error message
 */
function validateTheme(theme) {
  const validThemes = [
    'photorealistic',
    'anime',
    'oil-painting',
    'watercolor',
    'digital-art',
    'sketch',
    'impressionist',
    'surreal',
    'cyberpunk',
    'fantasy',
    'vintage',
    'minimalist'
  ];

  if (!theme || typeof theme !== 'string') {
    return {
      valid: false,
      error: 'Theme is required and must be a string'
    };
  }

  const normalizedTheme = theme.toLowerCase().trim();

  if (!validThemes.includes(normalizedTheme)) {
    return {
      valid: false,
      error: `Invalid theme "${theme}". Valid themes are: ${validThemes.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Validate aspect ratio
 * @param {string} ratio - The aspect ratio to validate
 * @returns {Object} Validation result with valid flag and error message
 */
function validateAspectRatio(ratio) {
  const validRatios = [
    '1:1',
    '4:3',
    '16:9',
    '3:2',
    '2:1',
    '9:16',
    '3:4'
  ];

  if (!ratio || typeof ratio !== 'string') {
    return {
      valid: false,
      error: 'Aspect ratio is required and must be a string'
    };
  }

  const normalizedRatio = ratio.toLowerCase().trim();

  if (!validRatios.includes(normalizedRatio)) {
    return {
      valid: false,
      error: `Invalid aspect ratio "${ratio}". Valid ratios are: ${validRatios.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Validate quality parameter
 * @param {number} quality - The quality value to validate (1-100)
 * @returns {Object} Validation result with valid flag and error message
 */
function validateQuality(quality) {
  if (typeof quality !== 'number' || isNaN(quality)) {
    return {
      valid: false,
      error: 'Quality must be a number'
    };
  }

  if (quality < 1 || quality > 100) {
    return {
      valid: false,
      error: 'Quality must be between 1 and 100'
    };
  }

  return { valid: true };
}

/**
 * Validate output directory
 * @param {string} outputDir - The output directory path
 * @returns {Object} Validation result with valid flag and error message
 */
function validateOutputDirectory(outputDir) {
  if (!outputDir || typeof outputDir !== 'string') {
    return {
      valid: false,
      error: 'Output directory is required and must be a string'
    };
  }

  const trimmedPath = outputDir.trim();
  if (trimmedPath.length === 0) {
    return {
      valid: false,
      error: 'Output directory cannot be empty'
    };
  }

  // Check for potentially dangerous paths
  const dangerousPatterns = [
    // /\.\./,  // Parent directory traversal
    // /^[\/\\]/,  // Absolute path
    /[<>:"|?*]/  // Invalid filename characters
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmedPath)) {
      return {
        valid: false,
        error: 'Output directory contains potentially dangerous characters or patterns'
      };
    }
  }

  return { valid: true };
}

/**
 * Validate filename
 * @param {string} filename - The filename to validate (without extension)
 * @returns {Object} Validation result with valid flag and error message
 */
function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return {
      valid: false,
      error: 'Filename is required and must be a string'
    };
  }

  const trimmedFilename = filename.trim();
  if (trimmedFilename.length === 0) {
    return {
      valid: false,
      error: 'Filename cannot be empty'
    };
  }

  if (trimmedFilename.length > 100) {
    return {
      valid: false,
      error: 'Filename must be less than 100 characters long'
    };
  }

  // Check for invalid filename characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(trimmedFilename)) {
    return {
      valid: false,
      error: 'Filename contains invalid characters'
    };
  }

  // Check for reserved names (Windows)
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];

  if (reservedNames.includes(trimmedFilename.toUpperCase())) {
    return {
      valid: false,
      error: 'Filename is a reserved system name'
    };
  }

  return { valid: true };
}

/**
 * Validate all command options
 * @param {Object} options - Options object to validate
 * @returns {Object} Validation result with valid flag and all errors
 */
function validateOptions(options) {
  const errors = [];
  const results = {};

  // Validate theme
  const themeResult = validateTheme(options.theme);
  results.theme = themeResult;
  if (!themeResult.valid) {
    errors.push(themeResult.error);
  }

  // Validate aspect ratio
  const ratioResult = validateAspectRatio(options.ratio);
  results.ratio = ratioResult;
  if (!ratioResult.valid) {
    errors.push(ratioResult.error);
  }

  // Validate quality
  const qualityResult = validateQuality(options.quality);
  results.quality = qualityResult;
  if (!qualityResult.valid) {
    errors.push(qualityResult.error);
  }

  // Validate output directory if save is true
  if (options.save) {
    const outputDirResult = validateOutputDirectory(options.outputDir);
    results.outputDir = outputDirResult;
    if (!outputDirResult.valid) {
      errors.push(outputDirResult.error);
    }

    // Validate custom filename if provided
    if (options.filename) {
      const filenameResult = validateFilename(options.filename);
      results.filename = filenameResult;
      if (!filenameResult.valid) {
        errors.push(filenameResult.error);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    results: results
  };
}

export {
  validatePrompt,
  validateTheme,
  validateAspectRatio,
  validateQuality,
  validateOutputDirectory,
  validateFilename,
  validateOptions
};