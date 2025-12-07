#!/usr/bin/env node

/**
 * Skill validation script for Gemini Image Generator
 * This script validates the complete skill structure and dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Gemini Image Generator Skill...\n');

// Check required files
const requiredFiles = [
  'package.json',
  'skill.json',
  'index.js',
  'README.md',
  'src/commands/generate-image.js',
  'src/lib/gemini-client.js',
  'src/utils/validation.js',
  'src/utils/options.js'
];

let allFilesValid = true;

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} (missing)`);
    allFilesValid = false;
  }
});

// Check package.json structure
console.log('\n📦 Validating package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  const requiredFields = ['name', 'version', 'description', 'main', 'dependencies'];
  requiredFields.forEach(field => {
    if (packageJson[field]) {
      console.log(`  ✅ ${field}`);
    } else {
      console.log(`  ❌ ${field} (missing)`);
      allFilesValid = false;
    }
  });

  // Check dependencies
  if (packageJson.dependencies && packageJson.dependencies['@google-ai/generativelanguage']) {
    console.log('  ✅ Gemini API dependency');
  } else {
    console.log('  ❌ Gemini API dependency missing');
    allFilesValid = false;
  }

} catch (error) {
  console.log(`  ❌ Invalid package.json: ${error.message}`);
  allFilesValid = false;
}

// Check skill.json structure
console.log('\n⚙️ Validating skill.json...');
try {
  const skillConfig = JSON.parse(fs.readFileSync('skill.json', 'utf8'));

  const requiredFields = ['name', 'version', 'description', 'commands', 'env'];
  requiredFields.forEach(field => {
    if (skillConfig[field]) {
      console.log(`  ✅ ${field}`);
    } else {
      console.log(`  ❌ ${field} (missing)`);
      allFilesValid = false;
    }
  });

  // Check command structure
  if (skillConfig.commands && skillConfig.commands['generate-image']) {
    console.log('  ✅ generate-image command defined');
  } else {
    console.log('  ❌ generate-image command missing');
    allFilesValid = false;
  }

  // Check environment requirements
  if (skillConfig.env && skillConfig.env.required && skillConfig.env.required.includes('GEMINI_API_KEY')) {
    console.log('  ✅ GEMINI_API_KEY requirement defined');
  } else {
    console.log('  ❌ GEMINI_API_KEY requirement missing');
    allFilesValid = false;
  }

} catch (error) {
  console.log(`  ❌ Invalid skill.json: ${error.message}`);
  allFilesValid = false;
}

// Check environment variables
console.log('\n🔑 Checking environment variables...');
if (process.env.GEMINI_API_KEY) {
  console.log('  ✅ GEMINI_API_KEY is set');
} else {
  console.log('  ⚠️  GEMINI_API_KEY not set (required for operation)');
}

// Check Node.js syntax
console.log('\n📝 Validating JavaScript syntax...');
const jsFiles = [
  'index.js',
  'src/commands/generate-image.js',
  'src/lib/gemini-client.js',
  'src/utils/validation.js',
  'src/utils/options.js'
];

jsFiles.forEach(file => {
  try {
    require.resolve(path.resolve(file));
    console.log(`  ✅ ${file}`);
  } catch (error) {
    console.log(`  ❌ ${file} - ${error.message}`);
    allFilesValid = false;
  }
});

// Check test files
console.log('\n🧪 Checking test files...');
if (fs.existsSync('test/skill.test.js')) {
  console.log('  ✅ Test file exists');
} else {
  console.log('  ❌ Test file missing');
  allFilesValid = false;
}

// Final summary
console.log('\n' + '='.repeat(50));
if (allFilesValid) {
  console.log('🎉 Skill validation PASSED! The skill is ready for use.');
  console.log('\n📋 Next steps:');
  console.log('1. Set your GEMINI_API_KEY environment variable');
  console.log('2. Run npm install to ensure dependencies are installed');
  console.log('3. Register the skill with Claude Code');
  console.log('4. Test with: /generate-image "beautiful sunset" --theme photorealistic');
} else {
  console.log('❌ Skill validation FAILED! Please fix the issues above.');
  process.exit(1);
}

console.log('\n🚀 Happy image generating!');