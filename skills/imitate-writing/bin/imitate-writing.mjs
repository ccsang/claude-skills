#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { learnStyle, listStyles, getStyle, deleteStyle, relearnStyle } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
    .name('imitate-writing')
    .description('Analyze and imitate writing styles')
    .version(packageJson.version);

program
    .command('learn')
    .argument('<source>', 'URL or file path to learn from')
    .option('-n, --name <name>', 'Name to save the style as (optional, generated if omitted)')
    .description('Learn a writing style from a source')
    .action(async (source, options) => {
        const spinner = ora(`Analyzing style from ${source}...`).start();
        try {
            const { filePath, name, evolved } = await learnStyle(source, options.name);
            if (evolved) {
                spinner.succeed(chalk.blue(`Style '${name}' evolved! Updated with new insights.`));
            } else {
                spinner.succeed(chalk.green(`Style '${name}' saved to ${filePath}`));
            }
        } catch (error) {
            spinner.fail(chalk.red(`Failed to learn style: ${error.message}`));
            if (process.env.DEBUG) console.error(error);
            process.exit(1);
        }
    });

program
    .command('list')
    .description('List saved styles')
    .action(() => {
        try {
            const styles = listStyles();
            if (styles.length === 0) {
                console.log(chalk.yellow('No styles found. Use "learn" to add one.'));
                return;
            }
            console.log(chalk.bold('Saved Styles:'));
            styles.forEach(s => {
                console.log(`- ${chalk.cyan(s.name)} (${chalk.gray(s.source)})`);
            });
        } catch (error) {
            console.error(chalk.red(`Error listing styles: ${error.message}`));
        }
    });

program
    .command('get')
    .argument('<name>', 'Name of the style')
    .description('Get the instruction for a specific style')
    .action((name) => {
        try {
            const instruction = getStyle(name);
            console.log(instruction);
        } catch (error) {
            console.error(chalk.red(`Error: ${error.message}`));
            process.exit(1);
        }
    });

program
    .command('delete')
    .argument('<name>', 'Name of the style to delete')
    .description('Delete a saved style')
    .action((name) => {
        try {
            deleteStyle(name);
            console.log(chalk.green(`Style '${name}' deleted successfully.`));
        } catch (error) {
            console.error(chalk.red(`Error: ${error.message}`));
            process.exit(1);
        }
    });

program
    .command('relearn')
    .argument('<name>', 'Name of the style to relearn')
    .description('Refresh an existing style from its original source')
    .action(async (name) => {
        const spinner = ora(`Re-learning style '${name}'...`).start();
        try {
            const { filePath } = await relearnStyle(name);
            spinner.succeed(chalk.green(`Style '${name}' refreshed and saved to ${filePath}`));
        } catch (error) {
            spinner.fail(chalk.red(`Failed to relearn style: ${error.message}`));
            if (process.env.DEBUG) console.error(error);
            process.exit(1);
        }
    });

program.parse();
