---
name: go-workspace-release
description:
  Standard operating procedure for committing, pushing, and version bumping a
  multi-module Go workspace in dependency order. Accepts a parameter specifying
  the release suffix.
---

# Go Workspace Release Workflow

When executing this skill, you must process the Go workspace following these
exact steps.

### Parameter: Release Suffix

The skill accepts a suffix parameter that dictates the tag format:

- `dev`: (Default) Creates a `-dev` tag (e.g., `v1.2.3-dev`).
- `prod`: Creates a production tag with no suffix (e.g., `v1.2.3`).
- `<custom>`: Creates a tag with the specified custom suffix (e.g.,
  `v1.2.3-<custom>`).

---

### Workflow

1. **Identify Repositories to Release** Find all repositories in the Go
   workspace that have local uncommitted changes or unpushed commits destined
   for `origin`.

2. **Process in Dependency Order** Process the identified repositories from the
   lowest level (fewest/no dependencies on other local modules) to the highest
   level. For each repository in this sequence, execute the following steps in
   order:
   - **Update References**: If this repository depends on any lower-level
     workspace modules that were bumped and tagged earlier in this workflow,
     update its references to the newly created tags (e.g., using
     `go get ...@<tag>` and `go mod tidy`).
   - **Commit**: Run the `commit-workflow` skill on this repository to commit
     any updated dependency references alongside any other local code changes
     (features, fixes, etc.).
   - **Push**: Push the local changes to `origin`.
   - **Determine Bump**: Analyze the commits to determine if a minor or patch
     version bump is required. **CRITICAL:** When determining the next version
     number, you must find the highest existing tag among both the latest `prod`
     (un-suffixed) tags and the latest tags matching the current suffix. You
     must pause and ask the user to confirm the proposed bumped version number,
     explicitly explaining the reasoning for your choice based on the commits.
   - **Tag & Push Tag**: Once the user approves the version number, create the
     new version tag applying the specified suffix (defaulting to `-dev`) using
     an explicit message to avoid getting stuck in the editor (e.g.,
     `git tag -a <tag> -m "<tag>"`) and push the tag to `origin`.
   - **Next**: Proceed to the next repository in the dependency sequence.
