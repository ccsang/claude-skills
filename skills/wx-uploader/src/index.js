#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import { WeChatAPI } from './wechat.js';
import { ArticleParser } from './parser.js';

dotenv.config();

const program = new Command();

program
    .name('wx-uploader')
    .description('Upload Markdown files to WeChat Official Account as drafts')
    .argument('<file>', 'Markdown file to upload')
    .option('--dry-run', 'Process file and print result without uploading to WeChat')
    .action(async (file, options) => {
        try {
            const filePath = path.resolve(process.cwd(), file);
            if (!await fs.pathExists(filePath)) {
                console.error(chalk.red(`Error: File not found: ${filePath}`));
                process.exit(1);
            }

            console.log(chalk.blue(`Processing ${filePath}...`));

            const appId = process.env.WECHAT_APP_ID;
            const appSecret = process.env.WECHAT_APP_SECRET;

            if (!options.dryRun && (!appId || !appSecret)) {
                console.error(chalk.red('Error: WECHAT_APP_ID and WECHAT_APP_SECRET environment variables are required.'));
                process.exit(1);
            }

            const api = new WeChatAPI(appId, appSecret);
            const parser = new ArticleParser(api);

            // In dry-run, we might need to mock image uploads or handle them gracefully in parser?
            // Actually parser calls api.uploadImage immediately. 
            // We should mock the API for dry-run.
            if (options.dryRun) {
                console.log(chalk.yellow('Running in DRY-RUN mode. API calls will be mocked.'));
                api.uploadImage = async (p) => {
                    console.log(chalk.gray(`[DryRun] Would upload image: ${p}`));
                    return 'http://mock-url.com/image.jpg';
                };
                api.uploadCover = async (p) => {
                    console.log(chalk.gray(`[DryRun] Would upload cover: ${p}`));
                    return { media_id: 'mock_media_id', url: 'http://mock-url.com/cover.jpg' };
                };
                api.addDraft = async (a) => {
                    console.log(chalk.green('[DryRun] Draft Payload:'));
                    console.log(JSON.stringify(a, null, 2));
                    return { media_id: 'mock_draft_id' };
                };
            }

            const article = await parser.process(filePath);

            if (options.dryRun) {
                // Already logged in mocked addDraft if called, but parser doesn't call addDraft, index.js does.
                // So we just log the article object here and skip addDraft if not called by parser.
                // Wait, parser returns the article object.
                await api.addDraft(article);
            } else {
                console.log(chalk.blue('Uploading draft to WeChat...'));
                const result = await api.addDraft(article);
                console.log(chalk.green(`Success! Draft created. Media ID: ${result.media_id}`));
            }

        } catch (error) {
            console.error(chalk.red('Error:'), error.message);
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    });

program.parse();
