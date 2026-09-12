# AI Agent Guide for Claude Skills Repository

This document guides AI agents interacting with this repository.

## Project Overview
This repository is the canonical source for all user-maintained skills for Codex and Claude Code. It is structured as a monorepo using **pnpm workspaces**. The workspace lives at `/Users/xixiaohai/code/claude-skills`—start sessions by running `cd /Users/xixiaohai/code/claude-skills`.

## Architecture & Structure
- **Package Manager**: `pnpm` (required for workspaces).
- **Workspaces**: Defined in `pnpm-workspace.yaml`.
- **Root Directory**: `package.json` (private, manages global scripts/dependencies).
- **Skills Directory**: `skills/`
    - All individual skills must be placed in subdirectories here (e.g., `skills/my-skill`).
    - The root `package.json` scripts (`test`, etc.) generally delegate to these workspaces.

### Current Skills
- **AI Image Generator**: `skills/ai-image`
- **YouTube Subtitle Downloader**: `skills/ydl-js`
- **YouTube Search**: `skills/youtube-search`

## Development Guidelines

### dependencies
- Run `pnpm install` in the root to install dependencies for all workspaces.
- Dependencies should be shared where possible to save space, but declared in the individual skill's `package.json`.

### Testing
- **Run all tests**: `pnpm test` (from root).
- **Run specific skill tests**: Navigate to the skill directory (e.g., `cd skills/gemini-image-generator`) and run `pnpm test`.

### Adding a New Skill
1. Create a new directory: `mkdir skills/<new-skill-name>`
2. Instruction-only skills need no package.json. For executable Node.js skills, initialize a package using pnpm.
3. **Important**: Add the new skill path to `pnpm-workspace.yaml` if the glob pattern `'skills/*'` doesn't cover it (it should).
4. Install dependencies: Use `pnpm add <pkg>` within the skill directory.

## Key Files to Read
- `pnpm-workspace.yaml`: Workspace definitions.
- `package.json`: Root scripts.
- `skills/<skill>/README.md`: Specific usage for that skill.

## Claude Skills Specification
(Based on [official documentation](https://code.claude.com/docs/en/skills))

### `SKILL.md` Format
Every skill directory must contain a `SKILL.md` file with YAML frontmatter.

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
allowed-tools: [Optional] List of tools allowed (e.g., Read, Grep)
---
# Your Skill Name
## Instructions
Provide clear, step-by-step guidance for Claude.
```

- **name**: Lowercase letters, numbers, and hyphens only (max 64 characters).
- **description**: Specific description text (max 1024 characters).
- **allowed-tools**: Optional list to restrict the skill's capabilities.

### Best Practices
- **Keep Skills Focused**: Split complex tasks into separate skills (e.g., "PDF form filling" vs "Excel analysis").
- **Clear Descriptions**: Explain *when* to use the skill and for what file types.
- **Project Structure**:
  - `skills/<skill-name>/SKILL.md` (Required)
  - `skills/<skill-name>/examples.md` (Optional)
  - `skills/<skill-name>/scripts/` (Optional helper scripts)

### Marketplace Registration
**CRITICAL**: Following the project being configured as a [Claude Plugin Marketplace](https://code.claude.com/docs/en/plugin-marketplaces), any time you **Add** or **Delete** a skill, you **MUST** update the global registry file:
`/.claude-plugin/marketplace.json`

- **Adding a skill**: Add a new entry to the `plugins` array matching the documentation schema.
- **Removing a skill**: Remove the corresponding entry from the `plugins` array.

## Canonical Maintenance and Project Installation

- Maintain all new and updated user-authored skills here, under skills/<name>/.
- GitHub source of truth: https://github.com/ccsang/claude-skills. Retain the existing repository name and history.
- Never install skills into personal/global skill directories unless the user explicitly changes this preference.
- Install only after the user names a target project: copy the requested complete skill directory into the project's .agents/skills/ for Codex, or .claude/skills/ for Claude Code. Do not install the entire collection automatically.
- Treat project-installed copies as versioned snapshots. Make shared changes here first, validate, commit/push, then update only requested projects. Preserve project-local edits and record the source commit in the project's maintenance notes.
- Keep SKILL.md concise; put conditional instructions in references/. Use relative links and runtime capability checks rather than local absolute paths or fixed model assumptions.
- Update README.md and .claude-plugin/marketplace.json when adding or removing skills.
- Run python3 scripts/validate_skills.py for metadata/registry validation. Instruction-only changes need no dependency installation; executable changes must also run their relevant tests.
- Do not include unrelated dirty files, credentials, generated media or personal runtime data in a skill commit.
