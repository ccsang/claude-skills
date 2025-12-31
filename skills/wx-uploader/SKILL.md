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

```

## Browser Automation / Manual Fallback Guide

If the API is blocked (e.g., due to IP whitelist restrictions), you can use browser automation (Puppeteer, Playwright, or agents) to perform the upload.

### 1. Login & Session
- **URL**: `https://mp.weixin.qq.com/`
- **Action**: Wait for user to scan QR code.
- **Success Criteria**: URL redirect to `https://mp.weixin.qq.com/cgi-bin/home...`

### 2. Upload Images (Material Management)
**Verified Flow (2025-12-31):**
1.  **Navigate**: Go to "Material Library" -> "Image" tab.
    - URL Pattern: `https://mp.weixin.qq.com/cgi-bin/filepage?type=2&begin=0&count=12&token={TOKEN}&lang=zh_CN`
2.  **Trigger Upload**:
    - **Button Selector**: `button.weui-desktop-btn_primary` (Green "Upload" button).
    - **Hidden Input**: The button triggers a hidden `input[type="file"]` located in `div.js_upload_btn_container input[type="file"]`.
    - **Action**: Use `element.uploadFile(path)` on the hidden input, or click the button and handle the file chooser.
3.  **Wait for Completion**:
    - The image list (`ul.weui-desktop-img-picker__list`) will refresh.
    - Wait for the new `li.weui-desktop-img-picker__item` to appear at the top.
4.  **Extract Data**:
    - **Image URL**: Located in the `style` attribute of the thumbnail `i` element.
      - Selector: `li.weui-desktop-img-picker__item .weui-desktop-img-picker__img-thumb`
      - Attribute: `style="background-image: url('https://mmbiz.qpic.cn/...');"`
    - **Media ID**: Often stored in `data-id` attribute of the `li` element or needs to be extracted from the network response of `/cgi-bin/filetransfer`.

### 3. Create Draft (Article Editor)
1.  **Navigate**: "Drafts" -> "New Article".
    - URL Pattern: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=10&token={TOKEN}&lang=zh_CN`
2.  **Fill Fields**:
    - **Title**: `#title` (Input)
    - **Author**: `#author` (Input)
    - **Content**: `.ProseMirror` (ContentEditable Div). **Note**: Use clipboard paste or `document.execCommand('insertHTML')` for best results, as direct `innerHTML` manipulation can be flaky with WeChat's editor.
3.  **Set Cover**:
    - Open Dialog: Click button in `.js_cover_btn_area` (look for text "从图片库选择").
    - Select Image: In the dialog (`.weui-desktop-dialog`), click the first item `.weui-desktop-img-picker__item`.
    - Confirm: Click "Use" or "Next" button (`button.weui-desktop-btn_primary`) in the dialog footer.
4.  **Save**:
    - Selector: `#js_save_draft`
    - Verify: Wait for "Saved" toast or page reload.

### Reference Implementation
A Puppeteer reference implementation can be found in `src/browser-wechat.js`. Note that WeChat's anti-bot protections (captchas, network throttling) may require manual intervention.
