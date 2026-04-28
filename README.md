# Pi Global Configuration Repository

This repository tracks my personal, global dotfiles and configuration for the [pi coding agent](https://pi.github.io/agent/). It is managed via version control (`jj`/`git`) to synchronize my agent workflow across different machines.

## Repository Structure

```text
.
├── .gitignore                     # Prevents sensitive data and third-party code from being tracked
├── README.md                      # This file
└── agent/
    ├── APPEND_SYSTEM.md           # Global system prompt additions and behavioral hooks
    ├── settings.json              # Global agent settings, preferences, and installed packages
    ├── extensions/                # Locally authored TypeScript extensions
    │   └── gcloud-config.ts       # Extension for interacting with Google Cloud configuration
    └── skills/                    # Locally authored Markdown-based agent skills
        ├── commit-workflow/       # Skill enforcing Conventional Commits and VCS best practices
        └── format-markdown/       # Skill enforcing Neovim formatting rules (Prettier) for markdown files
```

## What is Ignored?

For security and cleanliness, the following directories are excluded via `.gitignore`:

- `agent/auth.json` (Sensitive API keys)
- `agent/sessions/` (Chat history and state)
- `agent/*.log` (Runtime logs)
- `agent/git/` (Downloaded third-party git packages/skills)
- `agent/npm/` (Downloaded third-party npm packages/skills)

## Managing This Repository

This repository is initialized as a colocated `jj`/`git` repository.

To sync these settings to a new machine:

1. Clone this repository into `~/.pi`.
2. Ensure you recreate/provide your own `~/.pi/agent/auth.json`.
3. Start `pi`. The agent will automatically detect `settings.json` and clone any third-party packages into `agent/git/` or `agent/npm/` on startup.