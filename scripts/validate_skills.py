#!/usr/bin/env python3
"""Validate skill metadata and marketplace coverage. Requires PyYAML."""
import json
import re
from pathlib import Path
import yaml


def validate(root):
    errors = []
    skill_files = sorted((root / 'skills').glob('*/SKILL.md'))
    expected = {'./' + str(p.parent.relative_to(root)) for p in skill_files}
    registry = json.loads((root / '.claude-plugin/marketplace.json').read_text())
    listed = [s for plugin in registry['plugins'] for s in plugin.get('skills', [])]
    if set(listed) != expected:
        errors.append(f'Registry mismatch: missing={expected-set(listed)}, stale={set(listed)-expected}')
    for path in skill_files:
        parts = path.read_text().split('---', 2)
        if len(parts) != 3 or parts[0].strip():
            errors.append(f'{path.relative_to(root)}: missing YAML frontmatter')
            continue
        try:
            meta = yaml.safe_load(parts[1])
        except yaml.YAMLError as exc:
            errors.append(f'{path.relative_to(root)}: {exc}')
            continue
        if not isinstance(meta, dict):
            errors.append(f'{path.relative_to(root)}: metadata must be a mapping')
            continue
        name = meta.get('name')
        if not isinstance(name, str) or not re.fullmatch(r'[a-z0-9-]{1,64}', name) or name != path.parent.name:
            errors.append(f'{path.relative_to(root)}: invalid or mismatched name')
        description = meta.get('description')
        if not isinstance(description, str) or not description.strip() or len(description) > 1024:
            errors.append(f'{path.relative_to(root)}: invalid description')
    return errors, len(skill_files)


if __name__ == '__main__':
    errors, count = validate(Path(__file__).resolve().parents[1])
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Validated {count} skills and marketplace coverage.')
