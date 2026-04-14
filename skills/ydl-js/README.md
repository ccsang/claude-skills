# ydl-js

`ydl-js` is a fast, reliable YouTube subtitle downloader library and CLI tool, written in JavaScript.

## Features

*   Download YouTube subtitles/captions.
*   Support for multiple languages.
*   Output in SRT, JSON, or TXT format.
*   CLI and Library usage.
*   Multi-strategy fallback: yt-dlp → timedtext API → youtube-caption-extractor → Gemini audio transcription.

## Requirements

- **Node.js** ≥ 18
- **yt-dlp** (strongly recommended): `brew install yt-dlp`
- **GEMINI_API_KEY** (optional, for audio transcription and translation fallback)

## Installation

```bash
pnpm install
```

## Usage

To download subtitles, run the `ydl-js` command.

**Syntax**:
```bash
ydl-js <video_url> [options]
```

**Options**:
*   `-l, --lang <lang>`: Subtitle language (default: 'en').
*   `-f, --format <format>`: Output format ('srt', 'json', or 'txt', default: 'srt').
*   `-o, --output <file>`: Output file path.

**Examples**:

**1. Download English subtitles (default)**
```bash
ydl-js https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**2. Download subtitles in a specific language (e.g., Spanish)**
```bash
ydl-js https://www.youtube.com/watch?v=dQw4w9WgXcQ -l es
```

**3. Output to a file**
```bash
ydl-js https://www.youtube.com/watch?v=dQw4w9WgXcQ -o subtitles.srt
```

**4. Get output in JSON format**
```bash
ydl-js https://www.youtube.com/watch?v=dQw4w9WgXcQ -f json
```

**5. Get output in TXT format**
```bash
ydl-js https://www.youtube.com/watch?v=dQw4w9WgXcQ -f txt
```

## How It Works

ydl-js uses a multi-strategy fallback to maximize success:

1. **yt-dlp subtitle extraction** (recommended) — downloads subtitle tracks directly via yt-dlp (manual subs first, then auto-generated)
2. **Google timedtext API** — direct request for subtitle tracks (this endpoint is unreliable now)
3. **youtube-caption-extractor** — backup subtitle extraction library
4. **Gemini audio transcription** (requires `GEMINI_API_KEY`) — downloads audio and transcribes via Gemini API
5. **Gemini translation** (requires `GEMINI_API_KEY`) — auto-translates when subtitle language doesn't match request

## Library Usage

```javascript
import { downloadSubtitles, toSRT, toText } from 'ydl-js';

// Get subtitles as array of objects
const subtitles = await downloadSubtitles('dQw4w9WgXcQ', 'en');
// => [{ start: 0.32, dur: 1.68, text: "[♪♪♪]" }, ...]

// Convert to SRT string
const srtContent = toSRT(subtitles);

// Convert to plain text (no timestamps)
const textContent = toText(subtitles);
```
