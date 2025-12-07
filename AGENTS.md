# AI Agent Guide for Claude Skills Repository

This document guides AI agents interacting with this repository.

## Project Overview
This repository hosts a collection of "skills" for Claude Code. It is structured as a monorepo using **pnpm workspaces**.

## Architecture & Structure
- **Package Manager**: `pnpm` (required for workspaces).
- **Workspaces**: Defined in `pnpm-workspace.yaml`.
- **Root Directory**: `package.json` (private, manages global scripts/dependencies).
- **Skills Directory**: `skills/`
    - All individual skills must be placed in subdirectories here (e.g., `skills/my-skill`).
    - The root `package.json` scripts (`test`, etc.) generally delegate to these workspaces.

### Current Skills
- **Gemini Image Generator**: `skills/gemini-image-generator`
    - Uses Google's Gemini API for image generation.

## Development Guidelines

### dependencies
- Run `pnpm install` in the root to install dependencies for all workspaces.
- Dependencies should be shared where possible to save space, but declared in the individual skill's `package.json`.

### Testing
- **Run all tests**: `pnpm test` (from root).
- **Run specific skill tests**: Navigate to the skill directory (e.g., `cd skills/gemini-image-generator`) and run `pnpm test`.

### Adding a New Skill
1. Create a new directory: `mkdir skills/<new-skill-name>`
2. Initialize: `cd skills/<new-skill-name> && npm init -y` (or `pnpm init`)
3. **Important**: Add the new skill path to `pnpm-workspace.yaml` if the glob pattern `'skills/*'` doesn't cover it (it should).
4. Install dependencies: Use `pnpm add <pkg>` within the skill directory.

## Key Files to Read
- `pnpm-workspace.yaml`: Workspace definitions.
- `package.json`: Root scripts.
- `skills/<skill>/README.md`: Specific usage for that skill.
