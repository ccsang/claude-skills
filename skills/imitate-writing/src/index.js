
import fs from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { htmlToText } from 'html-to-text';
import { GoogleGenerativeAI } from '@google/generative-ai';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
dotenv.config();

const STORAGE_DIR = path.join(os.homedir(), '.imitate-writing', 'styles');

// API Helper
function getGeminiModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: "gemini-3-pro-preview",
        generationConfig: { responseMimeType: "application/json" }
    });
}

// Ensure storage exists
function ensureStorage() {
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
}

// Fetch content
async function fetchContent(source) {
    if (source.startsWith('http://') || source.startsWith('https://')) {
        // Use Puppeteer for robust fetching (handles JS rendering and basic anti-bot)
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Set a realistic User-Agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Set extra headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        });

        try {
            await page.goto(source, { waitUntil: 'networkidle2', timeout: 30000 });

            // Wait a bit for dynamic content if needed
            // await new Promise(r => setTimeout(r, 2000));

            const content = await page.content();
            const $ = cheerio.load(content);

            // Cleanup
            $('script, style, nav, footer, header, aside, iframe, noscript').remove();

            // Targeted cleanup for WeChat
            if (source.includes('mp.weixin.qq.com')) {
                $('#js_pc_qr_code').remove(); // remove QR code popup
                $('.qr_code_pc_outer').remove();
            }

            const text = htmlToText($.html(), {
                wordwrap: 130,
                pathVerification: 'off' // Disable image path verification to save time/errors
            });

            if (!text || text.trim().length < 50) {
                throw new Error('Content too short or empty. The URL might be blocked or empty.');
            }
            return text;
        } finally {
            await browser.close();
        }
    } else {
        if (!fs.existsSync(source)) {
            throw new Error(`File not found: ${source}`);
        }
        return fs.readFileSync(source, 'utf-8');
    }
}

// Analyze Style
export async function learnStyle(source, name) {
    ensureStorage();
    const content = await fetchContent(source);

    // Truncate if too long (approx 10k chars should be enough for style)
    const truncatedContent = content.slice(0, 15000);

    const model = getGeminiModel();
    const prompt = `
    You are an expert literary analyst and ghostwriter. Your goal is to create a "Style Guide" that allows another AI to perfectly imitate the author of the following text.

    **Step 1: Deconstruct the Text**
    Analyze the provided text deeply. Select 3-4 distinct excerpts that best showcase the author's unique voice. For each excerpt, analyze WHY it works (e.g., "Notice the use of a rhetorical question here," or "See how they transition instantly from a joke to a serious data point").

    **Step 2: Formulate the Instruction**
    Output a JSON object with:
    - "name": A short file-system safe slug (kebab-case) for this style.
    - "instruction": A comprehensive System Prompt. It MUST include:
        1. **Role/Persona**: Who is the writer?
        2. **Tone & Voice**: Precise adjectives.
        3. **Sentence Rhythm**: Staccato vs Flowing, etc.
        4. **Vocabulary & Diction**: Slang, jargon, formality.
        5. **Micro-Habits**: Punctuation, capitalization, formatting.
        6. **Negative Constraints**: What NOT to do.
        7. **Structure/Template**: How is a typical piece organized?
        8. **Classic Sentence Patterns (Deconstruction)**:
           - Select 3-4 *verbatim* excerpts that showcase the author's most "classic" or recognizable sentence structures.
           - For each, provide a "Pattern Analysis" explaining the syntax/rhythm (e.g. "Starts with a negative assertion, follows with a pivot").
           - Explain *how* to use this pattern in a new context.
    
    The "instruction" should be ready-to-use. When I use this prompt, I want the AI to not just know *about* the style, but to have concrete examples to follow.

    TEXT TO ANALYZE:
    ${truncatedContent}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    } catch (e) {
        // Fallback for non-json response (shouldn't happen with responseMimeType but just in case)
        parsed = { name: "unknown-style", instruction: jsonText };
    }

    const finalName = name || parsed.name || `style-${Date.now()}`;
    const filePath = path.join(STORAGE_DIR, `${finalName}.json`);
    const data = {
        name: finalName,
        source,
        learnedAt: new Date().toISOString(),
        instruction: parsed.instruction
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return { filePath, name: finalName };
}

export function listStyles() {
    ensureStorage();
    return fs.readdirSync(STORAGE_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => {
            const data = JSON.parse(fs.readFileSync(path.join(STORAGE_DIR, f), 'utf-8'));
            return { name: data.name, source: data.source };
        });
}

export function getStyle(name) {
    ensureStorage();
    const filePath = path.join(STORAGE_DIR, `${name}.json`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Style '${name}' not found.`);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return data.instruction;
}

export function deleteStyle(name) {
    ensureStorage();
    const filePath = path.join(STORAGE_DIR, `${name}.json`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Style '${name}' not found.`);
    }
    fs.unlinkSync(filePath);
    return filePath;
}
