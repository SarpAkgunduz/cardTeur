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
- 
## Do
- Read the relevant files before making changes, understand the existing code
- Use `multi_replace_string_in_file` when there are multiple independent changes
- Stick to dark theme colors for CSS changes
- Infer the most reasonable interpretation and apply it, then explain briefly
- Always but always no matter what, write comments in english and not in any other language, even if the codebase contains comments in another language. This is to ensure that the codebase remains accessible to the widest range of developers and to maintain consistency in communication. If you encounter existing comments in another language, you can translate them to English as part of your changes, but do not add new comments in a different language. And if there is another language in existing comments, translate it to English, do not leave it as is. This is a strict rule to ensure that the codebase is inclusive and understandable for all developers, regardless of their native language
## Requires confirmation
- Deleting files
- `git push`, `git reset --hard`, `git push --force`
- Database schema changes
