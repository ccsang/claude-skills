---
name: imitate-writing
description: Learn and imitate writing styles from URLs or text files. Support continuous learning from multiple sources.
---

# imitate-writing

`imitate-writing` is a Claude skill that uses Google Gemini to analyze the writing style of texts (from URLs or files) and generate a prompt instruction to imitate that style. 

**Key Features:**
- **Continuous Learning:** Feed multiple articles into the same style to evolve it.
- **No Recency Bias:** Synthesizes a master style guide from all observed sources.
- **Localized:** Automatically generates instructions in the same language as the source text.

## Prerequisites

*   `GEMINI_API_KEY` environment variable must be set.

## Usage

### Learn & Evolve a Style

Analyze a webpage or file. If the style name already exists, it will **evolve** the style by integrating the new source.

```bash
# Create a new style
imitate-writing learn https://paulgraham.com/avg.html --name paul-graham

# Evolve it with another article (improves the style)
imitate-writing learn ./another-essay.txt --name paul-graham
```

### List Styles

See all learned styles and their source counts.

```bash
imitate-writing list
```

### Get Style Instruction

Retrieve the generated system prompt for a style.

```bash
imitate-writing get paul-graham
```

### Relearn / Refresh

Force a re-synthesis of the style from all its saved sources. Useful after model updates or code changes.

```bash
imitate-writing relearn paul-graham
```

### Delete Style

```bash
imitate-writing delete paul-graham
```

---

## Storage

Styles are stored as folders in `~/.imitate-writing/styles/`.
- `instructions.md`: The compiled master System Prompt.
- `sources/`: Directory containing analysis of every source text added.
- `manifest.json`: Metadata.
