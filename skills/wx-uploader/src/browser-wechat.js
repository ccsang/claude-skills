
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import chalk from 'chalk';

export class BrowserWeChatAPI {
    constructor() {
        this.browser = null;
        this.page = null;
        this.sessionDir = path.join(os.homedir(), '.wx-uploader-session');
        this.mediaCache = new Map(); // Store uploaded media URLs
    }

    async init() {
        console.log(chalk.blue('Launching browser...'));
        this.browser = await puppeteer.launch({
            headless: false, // Must be headful for QR code scan
            defaultViewport: null,
            args: ['--start-maximized']
        });

        this.page = await this.browser.newPage();

        // Ensure session directory exists
        await fs.ensureDir(this.sessionDir);
        const cookiesPath = path.join(this.sessionDir, 'cookies.json');

        // Load cookies if exist
        if (await fs.pathExists(cookiesPath)) {
            const cookies = await fs.readJson(cookiesPath);
            await this.page.setCookie(...cookies);
        }

        await this.page.goto('https://mp.weixin.qq.com/', { waitUntil: 'networkidle2' });

        // Check if logged in
        if (this.page.url().includes('cgi-bin/home')) {
            console.log(chalk.green('Already logged in!'));
        } else {
            console.log(chalk.yellow('Please scan the QR code to login...'));
            // Wait for login redirection
            await this.page.waitForNavigation({
                timeout: 300000, // 5 minutes to scan
                waitUntil: 'networkidle2',
                predicate: url => url.includes('cgi-bin/home')
            });
            console.log(chalk.green('Login successful!'));

            // Save cookies
            const cookies = await this.page.cookies();
            await fs.writeJson(cookiesPath, cookies);
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    /**
     * Upload an image to be used inside an article (returns URL).
     * We use the "Material Management" page for this.
     * @param {string} imagePath 
     */
    async uploadImage(imagePath) {
        if (this.mediaCache.has(imagePath)) {
            return this.mediaCache.get(imagePath);
        }

        console.log(chalk.blue(`Uploading image via browser: ${imagePath}`));

        const token = new URL(this.page.url()).searchParams.get('token');
        const materialUrl = `https://mp.weixin.qq.com/cgi-bin/filepage?type=2&begin=0&count=10&group_id=0&token=${token}&lang=zh_CN`;

        await this.page.goto(materialUrl, { waitUntil: 'networkidle2' });

        // Wait for upload button to be present
        // Selector verified: .weui-desktop-btn_primary (Green Upload button)
        const uploadBtnSelector = '.weui-desktop-btn_primary';
        await this.page.waitForSelector(uploadBtnSelector, { visible: true });

        // Wait a bit for any overlays to clear
        await new Promise(r => setTimeout(r, 1000));

        // Click "Upload" button
        const [fileChooser] = await Promise.all([
            this.page.waitForFileChooser(),
            this.page.click(uploadBtnSelector)
        ]);

        await fileChooser.accept([imagePath]);

        // Wait for upload to complete
        // We can wait for the loading spinner to disappear or the list to update.
        console.log(chalk.gray('Waiting for upload to complete...'));
        await new Promise(r => setTimeout(r, 8000)); // 8s wait for upload to be safe

        // Get the background-image URL of the first item
        const imageUrl = await this.page.evaluate(() => {
            const firstItem = document.querySelector('.weui-desktop-img-picker__item .weui-desktop-img-picker__img-thumb');
            if (!firstItem) return null;
            const style = firstItem.getAttribute('style');
            const match = style.match(/url\("?(.*?)"?\)/);
            return match ? match[1] : null;
        });

        if (!imageUrl) {
            throw new Error('Failed to retrieve uploaded image URL');
        }

        this.mediaCache.set(imagePath, imageUrl);
        return imageUrl;
    }

    async uploadCover(imagePath) {
        // Reuse uploadImage logic.
        // Since we use the browser editor which picks from library, we don't strictly need media_id.
        const url = await this.uploadImage(imagePath);

        // Return a placeholder media_id. 
        // The real selection happens in addDraft by picking the first image.
        return {
            media_id: 'browser_uploaded_placeholder',
            url: url
        };
    }

    /**
     * Create a draft (not published yet).
     * @param {Object} article 
     */
    async addDraft(article) {
        console.log(chalk.blue('Creating draft via browser editor...'));

        const token = new URL(this.page.url()).searchParams.get('token');
        const editorUrl = `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=10&token=${token}&lang=zh_CN`;

        await this.page.goto(editorUrl, { waitUntil: 'networkidle2' });

        // 1. Set Title
        await this.page.waitForSelector('#title');
        await this.page.type('#title', article.title);

        // 2. Set Author
        await this.page.type('#author', article.author);

        // 3. Set Content
        await this.page.evaluate((content) => {
            // Updated editor selector often uses ProseMirror
            const editor = document.querySelector('#js_editor_area .ProseMirror') || document.querySelector('.ProseMirror');
            if (editor) {
                editor.innerHTML = content;
            } else {
                // Fallback to older editor if exists
                const ueditor = document.getElementById('ueditor_0');
                if (ueditor && ueditor.contentWindow) {
                    ueditor.contentWindow.document.body.innerHTML = content;
                }
            }
        }, article.content);

        // 4. Set Cover
        // If we have a cover, we assume it's the latest uploaded image.
        if (article.thumb_media_id) {
            console.log(chalk.gray('Selecting cover image...'));
            try {
                // Find "Select from library" button inside .js_cover_btn_area
                const coverAreaSelector = '.js_cover_btn_area';
                await this.page.waitForSelector(coverAreaSelector, { timeout: 5000 });

                // Click the button inside it. Often it's hidden or overlay.
                // Let's use evaluate to find the specific button text "从图片库选择"
                await this.page.evaluate(() => {
                    const btns = Array.from(document.querySelectorAll('.js_cover_btn_area .weui-desktop-btn, .js_cover_btn_area button'));
                    const target = btns.find(b => b.innerText.includes('从图片库选择'));
                    if (target) target.click();
                });

                // Wait for dialog
                await this.page.waitForSelector('.weui-desktop-dialog', { visible: true, timeout: 5000 });
                await new Promise(r => setTimeout(r, 1000));

                // Select first image
                await this.page.click('.weui-desktop-img-picker__item');

                // Click Next/Confirm
                await this.page.evaluate(() => {
                    const btns = Array.from(document.querySelectorAll('.weui-desktop-dialog__ft button'));
                    const target = btns.find(b => b.innerText.includes('下一步') || b.innerText.includes('确定'));
                    if (target) target.click();
                });

                // Possible second step for cropping
                await new Promise(r => setTimeout(r, 1000));
                await this.page.evaluate(() => {
                    if (document.querySelector('.weui-desktop-dialog')) {
                        const btns = Array.from(document.querySelectorAll('.weui-desktop-dialog__ft button'));
                        const target = btns.find(b => b.innerText.includes('完成') || b.innerText.includes('确定'));
                        if (target) target.click();
                    }
                });

            } catch (e) {
                console.error(chalk.red('Failed to set cover image automatically: ' + e.message));
            }
        }

        // 5. Save
        // Scroll to bottom
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        console.log(chalk.yellow('Draft content filled. Saving...'));
        try {
            // Find "Save as Draft" button
            // Selector: #js_save_draft (from research)
            const saveSelector = '#js_save_draft';
            await this.page.waitForSelector(saveSelector, { timeout: 5000 });
            await this.page.click(saveSelector);

            // Wait for success
            // Often redirects or shows a toast
            await new Promise(r => setTimeout(r, 3000));
            console.log(chalk.green('Draft saved (simulated confirmation).'));

        } catch (e) {
            console.log(chalk.red('Failed to click Save. Please save manually.'));
        }

        console.log(chalk.green('Done. Browser will remain open for 60s for verification.'));
        await new Promise(r => setTimeout(r, 60000));

        return { media_id: 'browser_uploaded' };
    }
}
