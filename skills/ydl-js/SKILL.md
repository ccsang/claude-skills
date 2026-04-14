---
name: ydl-js
description: YouTube 字幕下载工具。支持多语言字幕获取、SRT/JSON/TXT 格式输出，自动回退至 Gemini 音频转写和翻译。
---

# ydl-js

YouTube 字幕下载工具，支持 CLI 命令行和 JavaScript API 两种使用方式。

## 工作原理

ydl-js 采用多级回退策略获取字幕，确保最大成功率：

1. **yt-dlp 字幕提取**（推荐）— 通过 yt-dlp 直接下载字幕轨道（手工字幕优先，其次自动生成字幕）
2. **Google timedtext API** — 直接请求指定语言的字幕轨道（该端点已不稳定）
3. **youtube-caption-extractor** — 备用字幕提取库
4. **Gemini 音频转写**（需要 `GEMINI_API_KEY`）— 下载音频后通过 Gemini API 转录为文字
5. **Gemini 语言翻译**（需要 `GEMINI_API_KEY`）— 当获取到的字幕语言与请求语言不匹配时，自动翻译

音频下载优先使用 `yt-dlp`（需安装），回退到 `ytdl-core`。

## CLI 用法

```bash
ydl-js <YouTube URL 或视频 ID> [选项]
```

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-l, --lang <lang>` | 字幕语言（ISO 639-1 代码） | `en` |
| `-f, --format <format>` | 输出格式：`srt`、`json`、`txt` | `srt` |
| `-o, --output <file>` | 输出文件路径（不指定则输出到终端） | — |

### 示例

```bash
# 下载英文字幕（默认 SRT 格式）
ydl-js https://www.youtube.com/watch?v=dQw4w9WgXcQ

# 下载中文字幕
ydl-js https://www.youtube.com/watch?v=VIDEO_ID -l zh

# 输出为纯文本并保存到文件
ydl-js https://www.youtube.com/watch?v=VIDEO_ID -f txt -o transcript.txt

# 输出 JSON 格式（含时间戳）
ydl-js https://www.youtube.com/watch?v=VIDEO_ID -f json -o subs.json

# 也支持直接传视频 ID
ydl-js dQw4w9WgXcQ -l en
```

### 常用语言代码

| 代码 | 语言 |
|------|------|
| `en` | 英语 |
| `zh` | 中文 |
| `ja` | 日语 |
| `ko` | 韩语 |
| `es` | 西班牙语 |
| `fr` | 法语 |

## JavaScript API

```javascript
import { downloadSubtitles, toSRT, toText } from 'ydl-js';

// 获取字幕数组（含时间戳）
const subtitles = await downloadSubtitles('VIDEO_ID', 'zh');
// => [{ start: 0.0, dur: 3.5, text: "..." }, ...]

// 转换为 SRT 格式字符串
const srt = toSRT(subtitles);

// 转换为纯文本（仅文字，不含时间戳）
const text = toText(subtitles);
```

## 环境要求

- **Node.js** ≥ 18（必须）
- **yt-dlp**（强烈推荐，字幕获取的首选策略）：`brew install yt-dlp`
- **GEMINI_API_KEY**（可选，启用 Gemini 音频转写和字幕翻译能力）
