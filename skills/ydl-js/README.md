# ydl-js

`ydl-js` is a fast, reliable YouTube subtitle downloader library and CLI tool, written in JavaScript.

## Features

*   Download YouTube subtitles/captions.
*   Support for multiple languages.
*   Output in SRT or JSON format.
*   CLI and Library usage.

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

## Library Usage

```javascript
import { downloadSubtitles, toSRT } from './src/index.js';

// Get subtitles as array of objects
const subtitles = await downloadSubtitles('dQw4w9WgXcQ', 'en');

// Convert to SRT string
const srtContent = toSRT(subtitles);
console.log(srtContent);
```
