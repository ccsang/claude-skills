---
name: ydl-js
description: A fast, reliable YouTube subtitle downloader library and CLI tool.
---

# ydl-js

`ydl-js` is a tool for downloading YouTube subtitles in SRT or JSON format.

## Usage

You can use the `ydl-js` tool to download subtitles from a YouTube video URL.
By default, it downloads English subtitles in SRT format.

### Examples

**Download English subtitles (default):**

```bash
ydl-js https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Download subtitles in a specific language (e.g., Spanish):**

```bash
ydl-js https://www.youtube.com/watch?v=dQw4w9WgXcQ -l es
```

**Output to a file:**

```bash
ydl-js https://www.youtube.com/watch?v=dQw4w9WgXcQ -o subtitles.srt
```

**Get output in JSON format:**

```bash
ydl-js https://www.youtube.com/watch?v=dQw4w9WgXcQ -f json
```

## Options

*   `-l, --lang <lang>`: Subtitle language (default: 'en').
*   `-f, --format <format>`: Output format ('srt', 'json', or 'txt', default: 'srt').
*   `-o, --output <file>`: Output file path.
