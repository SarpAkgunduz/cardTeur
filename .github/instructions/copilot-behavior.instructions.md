---
description: "What Copilot should and should not do. Prevents unnecessary changes."
applyTo: "**"
---

# Copilot Behavior Rules

## Don't
- Add comments, docstrings, or JSDoc unless explicitly asked
- Refactor existing code — only make the requested change
- Create helper functions or abstraction layers for one-time operations
- Add unnecessary try/catch on top of existing error handling
- Write validation code for scenarios that don't exist
- Remove Bootstrap or other libraries and rewrite from scratch without being asked
- Add a feature to a page that already has a dedicated page for it (e.g. don't put email editing in AddPlayerForm when CrewPage owns that concern)

## Do
- Read the relevant files before making changes, understand the existing code
- Use `multi_replace_string_in_file` when there are multiple independent changes
- Stick to dark theme colors for CSS changes
- Infer the most reasonable interpretation and apply it, then explain briefly
- Always write comments in English regardless of the language used elsewhere in the codebase. Translate any non-English comments encountered during edits.
- When mode buttons are mutually exclusive, close all other modes when one is activated
- When implementing inline edit, always support keyboard shortcuts: Enter to save, Escape to cancel

## Requires confirmation
- Deleting files
- `git push`, `git reset --hard`, `git push --force`
- Database schema changes
