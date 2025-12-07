# YouTube Search Skill

A Claude Code skill to search for YouTube videos depending on `googleapis`.

## Installation

This skill is part of the `claude-skills` monorepo.

## Configuration

Ensure you have a `.env` file in the root or in this directory with:

```env
GOOGLE_API_KEY=your_api_key_here
# OR
YOUTUBE_API_KEY=your_api_key_here
```

## Usage

Run the CLI directly:

```bash
node bin/youtube-search "query"
```
