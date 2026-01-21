
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
        model: "gemini-3-flash-preview",
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
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        });

        try {
            await page.goto(source, { waitUntil: 'networkidle2', timeout: 30000 });
            const content = await page.content();
            const $ = cheerio.load(content);
            $('script, style, nav, footer, header, aside, iframe, noscript').remove();
            if (source.includes('mp.weixin.qq.com')) {
                $('#js_pc_qr_code').remove();
                $('.qr_code_pc_outer').remove();
            }
            const text = htmlToText($.html(), {
                wordwrap: 130,
                pathVerification: 'off'
            });
            if (!text || text.trim().length < 50) {
                throw new Error('Content too short or empty.');
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

// --- V2 Architecture Logic ---

function getStylePath(name) {
    return path.join(STORAGE_DIR, name);
}

function migrateLegacyStyle(name) {
    const legacyPath = path.join(STORAGE_DIR, `${name}.json`);
    const newPath = path.join(STORAGE_DIR, name);

    if (fs.existsSync(legacyPath) && !fs.existsSync(newPath)) {
        console.log(`Migrating legacy style '${name}'...`);
        const data = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));

        fs.mkdirSync(path.join(newPath, 'sources'), { recursive: true });

        // Save legacy instruction as a "source analysis" (best effort)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const legacyAnalysis = {
            source: data.source || data.sources?.[0] || 'legacy-migration',
            analyzedAt: data.learnedAt || new Date().toISOString(),
            analysis: {
                instruction: data.instruction
            },
            classic_patterns: [] // Legacy data didn't have structured patterns separate from instruction
        };

        fs.writeFileSync(
            path.join(newPath, 'sources', `legacy-${timestamp}.json`),
            JSON.stringify(legacyAnalysis, null, 2)
        );

        // Also save as current instruction
        fs.writeFileSync(path.join(newPath, 'instructions.md'), data.instruction);

        // Archive original file
        fs.unlinkSync(legacyPath);
    }
}

// 1. Analyze a single content piece WITHOUT synthesizing final prompt yet
async function analyzeContent(content, source) {
    const model = getGeminiModel();
    const prompt = `
    You are an expert literary analyst. Deconstruct the following text to identify the author's unique writing style.

    **Goal**: Create a structured analysis that can be used later to build a style guide.

    **Output JSON Structure**:
    - "language": Full English name of the language (e.g., "Simplified Chinese", "English", "Japanese").
    - "analysis":
        - "tone_voice": specific adjectives. Describe the emotional weight, attitude, and persona.
        - "article_structure": Detailed analysis of how the article is organized (intro, body, main arguments, conclusion, transitions, logic flow).
        - "sentence_rhythm": description of flow and cadence.
        - "vocabulary": formality, jargon, specific quirks.
        - "micro_habits": punctuation, formatting choices.
    - "classic_patterns": Array of objects { "excerpt": "verbatim text", "pattern_analysis": "explanation" } (Select 3-4 distinct high-quality examples).
    
    **IMPORTANT**: The analysis (values) MUST be written in the SAME language as the source text.

    TEXT TO ANALYZE:
    ${content.slice(0, 20000)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
}

// 2. Compile all analyses into one Master Instruction
async function compileStyle(name) {
    const styleDir = getStylePath(name);
    const sourcesDir = path.join(styleDir, 'sources');

    if (!fs.existsSync(sourcesDir)) return;

    const sourceFiles = fs.readdirSync(sourcesDir).filter(f => f.endsWith('.json'));
    const allAnalyses = sourceFiles.map(f => {
        return JSON.parse(fs.readFileSync(path.join(sourcesDir, f), 'utf-8'));
    });

    if (allAnalyses.length === 0) return;

    // Sort by analyzedAt to prioritize recent analyses
    allAnalyses.sort((a, b) => new Date(a.analyzedAt) - new Date(b.analyzedAt));

    // Try to find a defined language from any analysis, prioritizing the latest
    let language = 'the same language as the source text';
    for (let i = allAnalyses.length - 1; i >= 0; i--) {
        const langCandidate = allAnalyses[i].language || allAnalyses[i].analysis?.language;
        if (langCandidate) {
            language = langCandidate;
            break;
        }
    }

    const model = getGeminiModel();
    const prompt = `
    You are an expert Ghostwriter. I have gathered ${allAnalyses.length} analyses of an author's writing style.
    
    **Your Task**: Synthesize these analyses into ONE comprehensive, "Master Style Guide" (System Prompt).
    
    **Input Data**:
    ${JSON.stringify(allAnalyses.map((a, i) => ({ id: i + 1, analysis: a.analysis, patterns: a.classic_patterns })), null, 2)}

    **Output Requirement**:
    Output a JSON object with a single field: "instruction".
    The "instruction" must be a Markdown-formatted System Prompt that:
    1. **Synthesizes** the commonalities across all analyses. **CRITICAL**: You must specifically analyze and describe the **Article Structure** (how the author organizes arguments, narratives, or information) and **Tone/Voice** (the emotional weight, attitude, and persona).
    2. **Unified Voice**: Resolve any contradictions by prioritizing the most distinct/frequent traits.
    3. **Curated Examples**: Select the TOP 5-6 "Classic Sentence Patterns" from the provided list. Choose the ones that are most representative and diverse.
    4. **Language**: The instruction MUST be written in ${language}. If the language is not explicitly specified, detect it from the input analysis content and match it.
    
    Output JSON ONLY.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const json = JSON.parse(response.text());

    // Save the compiled instruction
    fs.writeFileSync(path.join(styleDir, 'instructions.md'), json.instruction);

    // Create/Update manifest
    const manifestPath = path.join(styleDir, 'manifest.json');
    const manifest = {
        name: name,
        updatedAt: new Date().toISOString(),
        sourceCount: allAnalyses.length,
        sources: allAnalyses.map(a => a.source)
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    return json.instruction;
}

// Main Learn Function
export async function learnStyle(source, name) {
    ensureStorage();

    let finalName = name;
    if (!finalName) {
        finalName = `style-${Date.now()}`;
    }

    // Check for legacy migration
    migrateLegacyStyle(finalName);

    const styleDir = getStylePath(finalName);
    const sourcesDir = path.join(styleDir, 'sources');
    fs.mkdirSync(sourcesDir, { recursive: true });

    // 1. Analyze
    const content = await fetchContent(source);
    const analysisJson = await analyzeContent(content, source);

    // 2. Save Analysis
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const saveData = {
        source: source,
        analyzedAt: new Date().toISOString(),
        ...analysisJson
    };
    const saveName = `${timestamp}.json`;
    fs.writeFileSync(path.join(sourcesDir, saveName), JSON.stringify(saveData, null, 2));

    // 3. Compile
    await compileStyle(finalName);

    return { filePath: path.join(styleDir, 'instructions.md'), name: finalName, evolved: true };
}

export function listStyles() {
    ensureStorage();
    const items = fs.readdirSync(STORAGE_DIR);
    const styles = [];

    for (const item of items) {
        const fullPath = path.join(STORAGE_DIR, item);

        // Check if Folder (V2)
        if (fs.statSync(fullPath).isDirectory()) {
            const manifestPath = path.join(fullPath, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
                styles.push({ name: manifest.name, source: `${manifest.sourceCount} sources` });
            } else {
                styles.push({ name: item, source: 'Unknown (V2)' });
            }
        }
        // Check if JSON (Legacy)
        else if (item.endsWith('.json')) {
            const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
            styles.push({ name: data.name, source: data.sources ? `${data.sources.length} sources` : data.source });
        }
    }
    return styles;
}

export function getStyle(name) {
    ensureStorage();

    // Try V2
    const v2Path = path.join(STORAGE_DIR, name, 'instructions.md');
    if (fs.existsSync(v2Path)) {
        return fs.readFileSync(v2Path, 'utf-8');
    }

    // Try Legacy
    const legacyPath = path.join(STORAGE_DIR, `${name}.json`);
    if (fs.existsSync(legacyPath)) {
        const data = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));
        return data.instruction;
    }

    throw new Error(`Style '${name}' not found.`);
}

export function deleteStyle(name) {
    ensureStorage();

    // Try V2
    const v2Path = path.join(STORAGE_DIR, name);
    if (fs.existsSync(v2Path)) {
        fs.rmSync(v2Path, { recursive: true, force: true });
        return;
    }

    // Try Legacy
    const legacyPath = path.join(STORAGE_DIR, `${name}.json`);
    if (fs.existsSync(legacyPath)) {
        fs.unlinkSync(legacyPath);
        return;
    }

    throw new Error(`Style '${name}' not found.`);
}

export async function relearnStyle(name) {
    ensureStorage();
    // In V2, "relearn" means "re-compile" using existing sources.
    migrateLegacyStyle(name);

    if (fs.existsSync(path.join(STORAGE_DIR, name))) {
        await compileStyle(name);
        return { filePath: path.join(STORAGE_DIR, name, 'instructions.md') };
    }

    throw new Error(`Style '${name}' not found.`);
}
