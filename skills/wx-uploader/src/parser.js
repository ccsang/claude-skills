import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { WeChatAPI } from './wechat.js';

export class ArticleParser {
    constructor(wechatApi) {
        this.api = wechatApi;
        this.md = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true
        });
    }

    /**
     * Process a markdown file and prepare it for WeChat draft.
     * @param {string} filePath 
     */
    async process(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        const frontmatter = parsed.data;
        let markdownBody = parsed.content;

        const baseDir = path.dirname(filePath);

        // 1. Handle Cover Image
        let thumbMediaId = null;
        if (frontmatter.cover_image) {
            const coverPath = path.resolve(baseDir, frontmatter.cover_image);
            if (await fs.pathExists(coverPath)) {
                console.log(`Uploading cover image: ${coverPath}...`);
                const result = await this.api.uploadCover(coverPath);
                thumbMediaId = result.media_id;
            } else {
                console.warn(`Cover image not found: ${coverPath}`);
            }
        }

        // 2. Handle Content Images
        // Find all images in markdown: ![alt](path)
        // We use a regex for simplicity or a token parser. 
        // A simple regex approach is usually enough for standard markdown images.
        const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
        let match;
        const replacements = [];

        while ((match = imageRegex.exec(markdownBody)) !== null) {
            const [fullMatch, alt, imgPath] = match;
            // Ignore external URLs
            if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
                continue;
            }

            const localPath = path.resolve(baseDir, imgPath);
            if (await fs.pathExists(localPath)) {
                replacements.push({
                    fullMatch,
                    localPath,
                    alt
                });
            }
        }

        // Upload and replace
        for (const item of replacements) {
            console.log(`Uploading content image: ${item.localPath}...`);
            try {
                const wxUrl = await this.api.uploadImage(item.localPath);
                // Replace in markdown body
                // Note: straightforward string replacement might be buggy if same image appears multiple times but we can handle it.
                // Better to replace exact string match if unique, or rebuild.
                // For simplicity, we'll replace the first occurrence of the full match that hasn't been replaced yet?
                // Actually, let's just do a global replace for that specific path if it appears multiple times.
                markdownBody = markdownBody.replace(item.fullMatch, `![${item.alt}](${wxUrl})`);
            } catch (e) {
                console.error(`Failed to upload ${item.localPath}:`, e.message);
            }
        }

        // 3. Convert to HTML
        const htmlContent = this.md.render(markdownBody);

        // 4. Construct Article Object
        return {
            title: frontmatter.title || path.basename(filePath, '.md'),
            author: frontmatter.author || '',
            digest: frontmatter.description || frontmatter.digest || '',
            content: htmlContent,
            content_source_url: frontmatter.url || '',
            thumb_media_id: thumbMediaId,
            need_open_comment: frontmatter.comment ? 1 : 0,
            only_fans_can_comment: 0
        };
    }
}
