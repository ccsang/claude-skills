import { getSubtitles } from 'youtube-caption-extractor';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import ytdl from '@ybd-project/ytdl-core';

dotenv.config();

/**
 * Download subtitles for a given YouTube video.
 * @param {string} videoId - The YouTube video ID.
 * @param {string} lang - The language code (default: 'en').
 * @returns {Promise<Array<{start: number, dur: number, text: string}>>} - Array of caption objects.
 */
export async function downloadSubtitles(videoId, lang = 'en') {
    try {
        const hasGeminiKey = Boolean(getGeminiApiKey());

        // Force-fetch from the timedtext endpoint for the requested language.
        let subtitles = await fetchTimedtextSubtitles(videoId, lang);

        // If timedtext is empty (common when YouTube blocks that endpoint), fall back to extractor.
        if (!subtitles || subtitles.length === 0) {
            subtitles = await getSubtitles({ videoID: videoId, lang });
        }

        // If we still have nothing, try Gemini transcription if available.
        if (!subtitles || subtitles.length === 0) {
            if (process.env.GEMINI_API_KEY) {
                console.log('Subtitle download failed, falling back to Gemini Audio API...');
                return await downloadAndTranscribe(videoId, lang);
            }
            throw new Error('No subtitles found');
        }

        // Validate language heuristically to avoid silent fallbacks.
        const languageLooksRight = await ensureLanguageMatch(subtitles, lang);
        if (languageLooksRight) {
            return subtitles;
        }

        // Try Gemini text translation when the track is in the wrong language.
        if (hasGeminiKey) {
            try {
                console.log('Subtitle language mismatch; attempting Gemini text translation...');
                return await translateSubtitles(subtitles, lang);
            } catch (translateError) {
                console.warn(`Subtitle language mismatch; Gemini translation failed: ${translateError.message}. Returning available track.`);
                return subtitles;
            }
        }

        if (!hasGeminiKey) {
            console.warn('Subtitle language mismatch; GEMINI_API_KEY not set, returning available track');
        }
        console.warn(`Warning: subtitles may not be in requested language "${lang}", returning available track`);
        return subtitles;
    } catch (error) {
        throw new Error(`Failed to fetch subtitles: ${error.message}`);
    }
}

async function downloadAndTranscribe(videoId, lang) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const audioPath = path.join(os.tmpdir(), `${videoId}.m4a`);

    try {
        await downloadAudio(url, audioPath);
        const transcript = await transcribeAudio(audioPath, lang);
        return transcript;
    } catch (err) {
        const message = err && err.stack ? err.stack : String(err);
        throw new Error(`Gemini transcription failed: ${message}`);
    } finally {
        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }
    }
}

async function downloadAudio(url, outputPath) {
    // Try yt-dlp CLI first (more reliable against YouTube bot detection)
    try {
        await downloadWithYtDlp(url, outputPath);
        return;
    } catch (ytDlpError) {
        // yt-dlp not available or failed, try ytdl-core
        console.log('yt-dlp not available, trying ytdl-core...');
    }

    // Fallback to ytdl-core
    let stream;
    try {
        const agent = new ytdl.default({
            clients: ['web', 'webCreator', 'tvEmbedded', 'ios', 'android'],
            disablePoTokenAutoGeneration: true,
            filter: format => format.container === 'm4a' && !format.hasVideo,
            quality: 'highestaudio'
        });

        stream = await agent.download(url);
    } catch (error) {
        const errorStr = String(error.message || error);
        const isBotDetection =
            errorStr.includes('Sign in to confirm') ||
            errorStr.includes('bot') ||
            error.playabilityStatus?.includes('bot');

        if (isBotDetection) {
            throw new Error(
                'YouTube bot detection triggered. Solutions:\n' +
                '1. Install yt-dlp: brew install yt-dlp\n' +
                '2. Try again later\n' +
                '3. Use a VPN or proxy'
            );
        } else {
            throw error;
        }
    }

    // Write stream to file
    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(outputPath);
        stream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        stream.on('error', reject);
    });
}

async function downloadWithYtDlp(url, outputPath) {
    const { execSync } = await import('child_process');

    // Check if yt-dlp is available
    try {
        execSync('which yt-dlp', { stdio: 'ignore' });
    } catch {
        throw new Error('yt-dlp not installed');
    }

    // Remove .m4a extension if present, yt-dlp will add it
    const basePath = outputPath.replace(/\.m4a$/, '');

    // Download audio using yt-dlp with Chrome cookies for authentication
    // -x: extract audio
    // --audio-format m4a: convert to m4a
    // --cookies-from-browser chrome: use Chrome cookies to bypass bot detection
    // -o: output template (yt-dlp adds extension automatically)
    execSync(`yt-dlp --cookies-from-browser chrome -x --audio-format m4a -o "${basePath}.%(ext)s" "${url}"`, {
        stdio: 'inherit'
    });
}

async function transcribeAudio(audioPath, lang) {
    const apiKey = getGeminiApiKey();
    const fileManager = new GoogleAIFileManager(apiKey);
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const uploadResult = await fileManager.uploadFile(audioPath, {
        mimeType: "audio/mp4", // m4a is mp4 audio
        displayName: "YouTube Audio",
    });

    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === "PROCESSING") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === "FAILED") {
        throw new Error("Audio processing failed.");
    }

    const prompt = `Transcribe the audio speech to text in ${lang || 'English'}. 
    Return a strictly valid JSON array of objects. 
    Each object must have:
    - "start": start time in seconds (number)
    - "dur": duration in seconds (number)
    - "text": the transcribed text string
    Ensure the JSON is raw and not wrapped in markdown block.`;

    const result = await model.generateContent([
        prompt,
        {
            fileData: {
                fileUri: uploadResult.file.uri,
                mimeType: uploadResult.file.mimeType,
            },
        },
    ]);

    const responseText = result.response.text();
    // Clean markdown code blocks if any
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(cleanJson);
    } catch (e) {
        throw new Error("Failed to parse Gemini response as JSON: " + responseText);
    }
}

/**
 * Format subtitles to SRT format.
 * @param {Array} subtitles - Array of caption objects.
 * @returns {string} - SRT formatted string.
 */
export function toSRT(subtitles) {
    return subtitles.map((sub, index) => {
        const start = formatTime(sub.start);
        const end = formatTime(parseFloat(sub.start) + parseFloat(sub.dur));
        return `${index + 1}
${start} --> ${end}
${sub.text}
`;
    }).join('\n');
}

/**
 * Format subtitles to plain text.
 * @param {Array} subtitles - Array of caption objects.
 * @returns {string} - Plain text string.
 */
export function toText(subtitles) {
    return subtitles.map(sub => sub.text).join('\n');
}

/**
 * Helper to format seconds to SRT time format (00:00:00,000).
 * @param {number|string} seconds 
 * @returns {string}
 */
function formatTime(seconds) {
    const date = new Date(0);
    date.setMilliseconds(seconds * 1000);
    const timeStr = date.toISOString().substr(11, 12).replace('.', ',');
    return timeStr;
}

/**
 * Fetch subtitles via the timedtext endpoint for an exact language.
 * @param {string} videoId
 * @param {string} lang
 * @returns {Promise<Array<{start: number, dur: number, text: string}>>}
 */
async function fetchTimedtextSubtitles(videoId, lang) {
    const url = `https://video.google.com/timedtext?lang=${encodeURIComponent(lang)}&v=${encodeURIComponent(videoId)}`;
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Referer: `https://www.youtube.com/watch?v=${videoId}`,
        },
    });
    if (!res.ok) {
        return [];
    }
    const xml = await res.text();
    if (!xml.trim() || !xml.includes('<text')) {
        return [];
    }

    return xml
        .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
        .replace('</transcript>', '')
        .split('</text>')
        .filter(line => line && line.trim())
        .map(line => {
            const startMatch = /start="([\d.]+)"/.exec(line);
            const durMatch = /dur="([\d.]+)"/.exec(line);
            const htmlText = line
                .replace(/<text[^>]*>/, '')
                .replace(/&amp;/gi, '&')
                .replace(/&#39;/gi, "'")
                .replace(/&quot;/gi, '"')
                .replace(/&lt;/gi, '<')
                .replace(/&gt;/gi, '>');
            const text = htmlText.replace(/<[^>]+>/g, '').trim();
            if (!startMatch || !durMatch || !text) {
                return null;
            }
            return {
                start: parseFloat(startMatch[1]),
                dur: parseFloat(durMatch[1]),
                text,
            };
        })
        .filter(Boolean);
}

/**
 * Guard: fail if subtitles do not match requested language.
 * Uses Gemini API if available, otherwise falls back to a permissive heuristic.
 * @param {Array<{text: string}>} subtitles
 * @param {string} lang
 * @returns {Promise<boolean>}
 */
async function ensureLanguageMatch(subtitles, lang) {
    if (!subtitles || subtitles.length === 0) {
        return false;
    }

    const hasGeminiKey = Boolean(getGeminiApiKey());
    if (hasGeminiKey) {
        try {
            return await detectLanguageWithGemini(subtitles, lang);
        } catch (e) {
            console.warn(`Gemini language detection failed: ${e.message}. Falling back to heuristic.`);
        }
    }

    // Permissive Fallback Heuristic
    // Only fail if it looks heavily like English but the user asked for something else (e.g. Chinese).
    // This allows French/Spanish ASCII, Symbols, etc. to pass through.

    const allText = subtitles.slice(0, 50).map(s => s.text || '').join(' '); // Sample first 50 lines
    if (!allText.trim()) return false;

    const langLower = lang.toLowerCase();

    // If user asked for English, and we rely on heuristic, it's usually safe to accept unless it's obviously CJK.
    // But honestly, the main failure mode we want to prevent is: User asks for Zh, YT gives En.

    if (langLower.startsWith('zh') || langLower.startsWith('ja') || langLower.startsWith('ko')) {
        // If target is CJK, but text is > 80% ASCII/Latin, it's likely English fallback.
        const totalChars = allText.length;
        const asciiChars = allText.replace(/[^\x00-\x7F]/g, '').length;
        if (asciiChars / totalChars > 0.8) {
            console.warn(`Heuristic check: Requested ${lang} but text is >80% ASCII. Rejecting.`);
            return false;
        }
    }

    return true; // Default to trust
}

async function detectLanguageWithGemini(subtitles, targetLang) {
    const sample = subtitles
        .slice(0, 30) // First 30 lines
        .map(s => s.text)
        .join('\n');

    const prompt = `Identify the primary language of the following text SAMPLE.
Return strictly a JSON object with a single key "language_code" (ISO 639-1, e.g. "en", "zh", "fr").
SAMPLE:
${sample}`;

    try {
        const apiKey = getGeminiApiKey();
        if (!apiKey) return false;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
        const result = await model.generateContent(prompt);
        return parseLanguageResponse(result.response.text(), targetLang);
    } catch (e) {
        console.warn('Gemini language detection failed:', e.message);
        return true; // Fail open
    }
}

function parseLanguageResponse(responseText, targetLang) {
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    try {
        const parsed = JSON.parse(cleanJson);
        const detected = parsed.language_code ? parsed.language_code.toLowerCase() : 'unknown';
        const target = targetLang.toLowerCase().split('-')[0];
        console.log(`Gemini detected language: ${detected} (Target: ${target})`);

        if (detected === target) return true;
        if (detected === 'unknown') return true;
        // Strict mismatch
        return false;
    } catch (e) {
        console.warn('Failed to parse Gemini language response:', responseText);
        return true;
    }
}

/**
 * Translate subtitle texts into the requested language using Gemini.
 * @param {Array<{start:number|string,dur:number|string,text:string}>} subtitles
 * @param {string} targetLang
 * @returns {Promise<Array<{start:number|string,dur:number|string,text:string}>>}
 */
async function translateSubtitles(subtitles, targetLang) {
    let GoogleGenAI;
    try {
        ({ GoogleGenAI } = await import('@google/genai'));
    } catch (e) {
        throw new Error('Translation requires @google/genai. Please install it (pnpm add @google/genai).');
    }

    const chunkSize = 40;
    const translated = [];

    const apiKey = getGeminiApiKey();
    if (!apiKey) throw new Error("GEMINI_API_KEY not set for translation");

    const client = new GoogleGenAI({ apiKey });

    // Helper to run a chunk
    const translateChunk = async (chunk) => {
        const prompt = `Translate the following subtitles to Simplified Chinese (${targetLang}).
Use Chinese characters and avoid Japanese kana (hiragana/katakana).
Return ONLY JSON (no markdown code fences).
Keep the same start and dur values; only translate text.
Input JSON: ${JSON.stringify(chunk)}`;

        const stream = await client.models.generateContentStream({
            model: 'gemini-3-pro-preview',
            config: { thinkingConfig: { thinkingLevel: 'LOW' } },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        let responseText = '';
        for await (const chunk of stream) {
            const piece = typeof chunk.text === 'function' ? chunk.text() : chunk.text;
            if (piece) {
                responseText += piece;
                continue;
            }
            const parts = chunk?.candidates?.[0]?.content?.parts;
            if (parts && Array.isArray(parts)) {
                responseText += parts.map(p => p.text || '').join('');
            }
        }
        return responseText;
    };

    for (let i = 0; i < subtitles.length; i += chunkSize) {
        const chunk = subtitles.slice(i, i + chunkSize);
        let responseText;

        try {
            responseText = await translateChunk(chunk);
        } catch (err) {
            console.error(`Translation failed for chunk ${i}: ${err.message}. Using original.`);
            translated.push(...chunk);
            continue;
        }

        responseText = responseText.replace(/```json|```/g, '').trim();
        try {
            let parsed = JSON.parse(responseText);
            if (parsed && !Array.isArray(parsed)) parsed = [parsed];
            translated.push(...parsed);
        } catch (err) {
            console.error(`Failed to parse translation JSON for chunk ${i}. Using original.`);
            translated.push(...chunk);
        }
    }

    return translated;
}

function getGeminiApiKey() {
    return process.env.GEMINI_API_KEY ||
        process.env.GEMINI_APIKEY ||
        process.env.gemini_api_key ||
        process.env.gemini_apikey;
}
