---
name: wx-uploader
description: A CLI tool to upload Markdown files to WeChat Official Accounts.
version: 0.1.0
author: Antigravity
keywords: [wechat, markdown, uploader, cli]
usage: "wx-uploader <file.md> [options]"
examples:
  - "wx-uploader article.md"
  - "wx-uploader article.md --dry-run"
---

# WeChat MP Uploader

Similar to `wx-uploader` by tyrchen, this skill helps you publish Markdown files to WeChat Official Accounts directly from the command line.

## Features

- **Frontmatter Parsing**: Reads metadata from your Markdown file (title, author, digest, cover_image).
- **Auto Image Upload**: Detects local images in the Markdown, uploads them to WeChat, and replaces the links.
- **Draft Creation**: Uploads the content as a draft (saved in WeChat backend), ready for preview and publishing.
- **Dry Run**: Preview the parsed content and API calls without actually uploading.

## Environment Variables

- `WECHAT_APP_ID`: Your WeChat Official Account App ID.
- `WECHAT_APP_SECRET`: Your WeChat Official Account App Secret.

## Frontmatter Format

```yaml
---
title: My Article Title
author: Me
digest: Short summary
cover_image: ./cover.png
---
```
