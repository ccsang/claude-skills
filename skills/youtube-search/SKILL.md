---
name: youtube-search
version: 1.0.0
description: Search for YouTube videos and get playback URLs.
---

# YouTube Search

Search for videos on YouTube using the YouTube Data API v3.

## Usage

```bash
# Search for videos
node skills/youtube-search/bin/youtube-search "search query"

# Limit results
node skills/youtube-search/bin/youtube-search "search query" -n 3
```

## Requirements

- Node.js 16+
- Google Cloud API Key with **YouTube Data API v3** enabled.
- Set `YOUTUBE_API_KEY` or `GOOGLE_API_KEY` in your environment.
