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
        const subtitles = await getSubtitles({ videoID: videoId, lang });
        // Start and dur in youtube-caption-extractor are strings? No, JSDoc says number, but often they are string in JSON response?
        // Let's ensure they are numbers to be safe, or just return as is if the original lib works well.
        // My formatTime function expected numbers/strings so it's fine.
        if (!subtitles || subtitles.length === 0) {
            throw new Error('No subtitles found');
        }
        return subtitles;
    } catch (error) {
        if (process.env.GEMINI_API_KEY) {
            console.log('Subtitle download failed, falling back to Gemini Audio API...');
            return await downloadAndTranscribe(videoId, lang);
        }
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
    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
