import { getSubtitles } from 'youtube-caption-extractor';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ytdlParams = require('@ybd-project/ytdl-core');
const ytdl = ytdlParams.default || ytdlParams;

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
        const languageLooksRight = ensureLanguageMatch(subtitles, lang);
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
    return new Promise((resolve, reject) => {
        const stream = ytdl(url, {
            filter: format => format.container === 'm4a' && !format.hasVideo,
            quality: 'highestaudio'
        });

        stream.pipe(fs.createWriteStream(outputPath));

        stream.on('end', resolve);
        stream.on('error', reject);
    });
}

async function transcribeAudio(audioPath, lang) {
    const apiKey = getGeminiApiKey();
    const fileManager = new GoogleAIFileManager({ apiKey });
    const genAI = new GoogleGenerativeAI({ apiKey });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
 * Heuristic language guard: fail if subtitles do not resemble requested language.
 * @param {Array<{text: string}>} subtitles
 * @param {string} lang
 */
function ensureLanguageMatch(subtitles, lang) {
    if (!subtitles || subtitles.length === 0) {
        return false;
    }

    const allText = subtitles.map(s => s.text || '').join(' ');
    if (!allText.trim()) {
        return false;
    }

    const totalChars = allText.length;
    const asciiChars = allText.replace(/[^\x00-\x7F]/g, '').length;
    const langLower = lang.toLowerCase();

    if (langLower.startsWith('en')) {
        const asciiRatio = asciiChars / totalChars;
        return asciiRatio >= 0.6;
    } else if (langLower.startsWith('zh') || langLower.startsWith('ja') || langLower.startsWith('ko')) {
        const cjkMatches = allText.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/g) || [];
        const cjkRatio = cjkMatches.length / totalChars;
        return cjkRatio >= 0.2;
    } else {
        // For other languages, just ensure we didn't silently fall back to empty/ASCII-only.
        const asciiRatio = asciiChars / totalChars;
        return asciiRatio <= 0.95;
    }
}

/**
 * Translate subtitle texts into the requested language using Gemini.
 * @param {Array<{start:number|string,dur:number|string,text:string}>} subtitles
 * @param {string} targetLang
 * @returns {Promise<Array<{start:number|string,dur:number|string,text:string}>>}
 */
async function translateSubtitles(subtitles, targetLang) {
    const apiKey = getGeminiApiKey();
    let GoogleGenAI;
    try {
        ({ GoogleGenAI } = await import('@google/genai'));
    } catch (e) {
        throw new Error('Translation requires @google/genai. Please install it (pnpm add @google/genai) or update dependencies.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-pro-preview';
    const chunkSize = 40; // keep payloads small to reduce parse issues
    const translated = [];

    for (let i = 0; i < subtitles.length; i += chunkSize) {
        const chunk = subtitles.slice(i, i + chunkSize);
        const prompt = `Translate the following subtitles to ${targetLang}.
Return ONLY JSON (no markdown code fences).
Keep the same start and dur values; only translate text.
Input JSON: ${JSON.stringify(chunk)}`;

        const stream = await ai.models.generateContentStream({
            model,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }],
                },
            ],
            config: {
                thinkingConfig: { thinkingLevel: 'LOW' },
            },
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

        responseText = responseText.replace(/```json|```/g, '').trim();
        let parsed;
        try {
            parsed = JSON.parse(responseText);
        } catch (err) {
            throw new Error(`Gemini translation returned non-JSON for chunk: ${responseText}`);
        }

        if (parsed && !Array.isArray(parsed)) {
            parsed = [parsed];
        }

        translated.push(...parsed);
    }

    return translated;
}

function getGeminiApiKey() {
    return process.env.GEMINI_API_KEY ||
        process.env.GEMINI_APIKEY ||
        process.env.gemini_api_key ||
        process.env.gemini_apikey;
}
