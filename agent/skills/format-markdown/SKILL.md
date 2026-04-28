---
name: format-markdown
description: Standard operating procedure for formatting markdown files. The agent must read this upon creating or modifying a .md file.
---

# Format Markdown

This agent enforces strict formatting rules for Markdown files, matching the user's global Neovim configuration (`conform.nvim` with `prettier_markdown`).

When you create or modify a `.md` file, you must run `prettier` to format it according to the rules:

### Formatting Rules
- **Line Width (Text Width):** 80 characters
- **Prose Wrap:** Always wrap prose at the print width.

### Execution
Run the following bash command on the modified file(s) before completing your task:

```bash
npx prettier --write --prose-wrap always --print-width 80 <file-path>
```
