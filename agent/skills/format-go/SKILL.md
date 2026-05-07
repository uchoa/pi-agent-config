---
name: format-go
description: Standard operating procedure for formatting Go files. The agent must read this upon creating or modifying a .go file.
---

# Format Go

This agent enforces strict formatting rules for Go files.

When you create or modify a `.go` file, you must run `gofmt` to format it according to standard Go conventions.

### Execution
Run the following bash command on the modified file(s) before completing your task:

```bash
gofmt -w <file-path>
```
