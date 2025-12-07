# ydl-js

A fast, reliable YouTube subtitle downloader library and CLI tool, written in JavaScript.

 Inspired by [ydl-rs](https://github.com/tyrchen/ydl-rs).

## Features

*   Download YouTube subtitles/captions.
*   Support for multiple languages.
*   Output in SRT or JSON format.
*   CLI and Library usage.

## Installation

```bash
pnpm install
```

## CLI Usage

```bash
# Run via node
node bin/ydl-js <video_url> [options]

# Example: Download English subtitles to a file
node bin/ydl-js https://www.youtube.com/watch?v=dQw4w9WgXcQ -o my_subtitles.srt
```

### Options

*   `-l, --lang <lang>`: Specify language code (default: `en`).
*   `-f, --format <format>`: Specify output format: `srt` or `json` (default: `srt`).
*   `-o, --output <file>`: Save output to a file.

## Library Usage

```javascript
import { downloadSubtitles, toSRT } from './src/index.js';

// Get subtitles as array of objects
const subtitles = await downloadSubtitles('dQw4w9WgXcQ', 'en');

// Convert to SRT string
const srtContent = toSRT(subtitles);
console.log(srtContent);
```
