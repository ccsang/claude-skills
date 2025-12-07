import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Search for videos on YouTube.
 * @param {string} query - The search query.
 * @param {number} maxResults - Maximum number of results to return (default: 5).
 * @returns {Promise<Array<{title: string, videoId: string, url: string, description: string, channelTitle: string}>>}
 */
export async function searchVideos(query, maxResults = 5) {
    // Gemini keys cannot call YouTube Data API v3; require a proper YouTube/Google API key.
    const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('API key not found. Please set YOUTUBE_API_KEY or GOOGLE_API_KEY in .env');
    }

    const youtube = google.youtube({
        version: 'v3',
        auth: apiKey
    });

    try {
        const response = await youtube.search.list({
            part: 'id,snippet', // ensure we get videoId
            q: query,
            type: 'video',
            maxResults: maxResults
        });

        const videos = (response.data.items || [])
            // Some items may lack videoId; drop them to avoid undefined URLs.
            .filter(item => item?.id?.videoId)
            .map(item => ({
                title: item.snippet.title,
                videoId: item.id.videoId,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                description: item.snippet.description,
                channelTitle: item.snippet.channelTitle
            }));

        return videos;
    } catch (error) {
        throw new Error(`YouTube search failed: ${error.message}`);
    }
}
