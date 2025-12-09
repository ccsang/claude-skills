---
name: imitate-writing
description: Learn and imitate writing styles from URLs or text files.
---

# imitate-writing

`imitate-writing` is a Claude skill that uses Google Gemini to analyze the writing style of a given text (from a URL or file) and generate a prompt instruction to imitate that style.

## Prerequisites

*   `GEMINI_API_KEY` environment variable must be set.

## Usage

### Learn a Style

Analyze a webpage or file and save the style profile.

```bash
# From a URL
imitate-writing learn https://paulgraham.com/avg.html --name paul-graham

# From a file
imitate-writing learn ./my-article.txt --name my-style
```

### List Styles

See all learned styles.

```bash
imitate-writing list
```

### Get Style Instruction

Retrieve the generated system prompt for a style. You can pipe this into another LLM call or copies it to your clipboard.

```bash
imitate-writing get paul-graham
```

***

## Storage

Styles are stored as JSON files in `~/.imitate-writing/styles/`.
