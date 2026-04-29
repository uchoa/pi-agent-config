---
name: format-go
description:
  Standard operating procedure for formatting Go files. The agent must read this
  upon creating or modifying a .go file.
---

# Format Go

This agent enforces strict formatting rules for Go (`.go`) files, matching the
user's global Neovim configuration (`conform.nvim` with `gofumpt` and
`golines`).

When you create or modify a `.go` file, you must run both `gofumpt` and
`golines` to format it according to the rules.

### Formatting Rules

- Format code using `gofumpt`.
- Auto-wrap comments (and long code lines) at 80 characters using `golines`.
  **Note:** `gofumpt` does not enforce line length limits, so running `golines`
  afterward is strictly mandatory to prevent long lines from remaining
  unwrapped.

### Execution

You must run the following tools on any modified `.go` file(s) **always before
compiling and running any tests** that are part of your execution plan, and
before completing your task:

1. Check if `gofumpt` and `golines` are available in your system path (or
   `~/go/bin/`).
2. **If `golines` or `gofumpt` is NOT available:**
   - Stop formatting immediately.
   - Provide the user with the installation instructions:
     ```bash
     go install mvdan.cc/gofumpt@latest
     go install github.com/segmentio/golines@latest
     ```
   - **Wait for the user to confirm** they have installed the tools and tell you
     to retry before proceeding with the task.
3. If they ARE available, format the file(s) by running this combined command:

```bash
gofumpt -w <file-path> && golines -m 80 --shorten-comments -w <file-path>
```
