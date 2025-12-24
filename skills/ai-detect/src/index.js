
import puppeteer from 'puppeteer';

export async function detectAI(text) {
    if (!text || text.trim().length === 0) {
        throw new Error("Input text is empty.");
    }

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate
        await page.goto('https://matrix.tencent.com/ai-detect/', { waitUntil: 'networkidle2' });

        // Check if we need to clear (if the box is already filled from cookie state)
        // Try to find the textarea. If not found, look for .txt-segment-box and clear button.
        const textareaSelector = '.el-textarea__inner';
        const clearBtnSelector = '.clear-btn';

        // Wait briefly to see state
        try {
            await page.waitForSelector(textareaSelector, { timeout: 3000 });
        } catch (e) {
            // Textarea not found, maybe result state? Try clicking clear.
            const clearBtn = await page.$(clearBtnSelector);
            if (clearBtn) {
                await clearBtn.click();
                await page.waitForSelector(textareaSelector, { timeout: 2000 });
            } else {
                throw new Error("Could not find input area or clear button.");
            }
        }

        // Input text with delay to mimic human behavior
        await page.type(textareaSelector, text, { delay: 50 });

        // Submit
        const submitBtnSelector = '.submit-btn';
        await page.waitForSelector(submitBtnSelector);
        // Ensure enabled (sometimes disabled if text too short/long)
        await page.click(submitBtnSelector);

        // Wait for result
        // We look for the download link which appears after success
        const downloadLinkSelector = '.download-link';
        try {
            await page.waitForSelector(downloadLinkSelector, { timeout: 20000 });
        } catch (e) {
            // Check for error messages or limits
            const debugText = await page.evaluate(() => document.body.innerText);
            if (debugText.includes("今日剩余0次")) throw new Error("Usage limit reached.");
            throw new Error(`Timeout waiting for detection result. Page text snippet: ${debugText.slice(0, 200)}`);
        }

        // Debug: Capture screenshot
        // await page.screenshot({ path: '/Users/xixiaohai/.gemini/antigravity/brain/3227d40b-4bcc-4a8a-a1b0-fa100b387ed6/debug_ai_detect.png', fullPage: true });

        // Extract result
        const resultText = await page.evaluate(() => {
            const mainContent = document.querySelector('.ai-detect-container') || document.body;
            const text = mainContent.innerText;

            // Try in-order priority mapping
            if (text.includes("AI生成可能性高")) return "Result: AI Generate High (AI生成可能性高)";
            if (text.includes("疑似AI生成")) return "Result: Suspected AI (疑似AI生成)";
            if (text.includes("人工创作特征明显")) return "Result: Human Written (人工创作特征明显)";
            if (text.includes("人工创作特征较弱")) return "Result: Weak Human Features (人工创作特征较弱)";

            // Fallback
            const dlLink = document.querySelector('.download-link');
            if (dlLink && dlLink.parentElement) {
                // Clean up the text
                return dlLink.parentElement.innerText.replace("下载报告", "").trim();
            }
            return text.slice(0, 500);
        });

        return resultText;

    } finally {
        await browser.close();
    }
}
