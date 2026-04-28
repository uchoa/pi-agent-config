---
name: commit-workflow
description: Standard operating procedure for committing code. The agent must read this upon completing any task.
---

# Commit Workflow

Before proceeding with VCS tasks, verify whether this project is a Jujutsu (`jj`) repository, a `git` repository, or not a repository at all (e.g., by checking for `.jj` or `.git` directories, or running `jj root` / `git rev-parse --is-inside-work-tree`).
If the project is not a repository, ignore the VCS-related instructions below.

When completing a task or a logical unit of work in a repository, you must create a commit using the appropriate VCS (`jj` or `git`).

### Commit Message Guidelines
All commit messages must strictly follow the **Angular conventions** for **Conventional Commits** (https://www.conventionalcommits.org/en/v1.0.0/). 

The basic structure is:
```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Allowed `<type>`s include: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

### Workflow
1. Complete the required code changes or tasks.
2. Formulate a commit message adhering to the guidelines above.
3. **Important:** Before executing the commit, you must ask the user to validate the proposed commit and commit message.
4. Once the user approves, execute the commit using the detected VCS:
   - For `jj`: `jj commit -m "<message>"`
   - For `git`: `git commit -m "<message>"` (make sure to stage files appropriately first)