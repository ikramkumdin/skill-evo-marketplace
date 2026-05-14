---
name: Commit Summarizer
description: |
  Summarize the last N commits from a git repo into a release-ready
  changelog grouped by type (feat / fix / docs / chore / test).
  Use when the user asks for a changelog, release notes, or weekly digest.
allowed-tools:
  - Bash(git log:*)
  - Bash(git diff:*)
  - Read
---

# Commit Summarizer

Read the most recent commits and produce a Markdown changelog grouped by
conventional-commit type.

## When to invoke

- User asks for "changelog", "release notes", "what changed this week"
- User says "summarize commits" or "what shipped"

## How it works

1. Default range: last 50 commits or last 7 days, whichever is smaller.
   Override with `--since=<date>` or `--count=<n>` if the user specifies.
2. Run `git log --pretty=format:"%h %s%n%b" --no-merges <range>`.
3. Parse each subject line; bucket by leading conventional-commit type:
   `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `style`, `ci`, `build`.
   Anything without a recognizable prefix goes into "Other".
4. Emit a Markdown report:

   ```markdown
   ## Release notes — <range description>

   ### ✨ Features
   - <subject> (<short-sha>)
   ...

   ### 🐛 Fixes
   - <subject> (<short-sha>)
   ...
   ```

5. Skip empty buckets. Skip commits whose subject starts with `wip`, `tmp`, or `chore(deps)` unless the user asks for them explicitly.

## Things to watch for

- **Squash-merge style**: lots of `Merge pull request #N` subjects. Strip
  the `Merge pull request` prefix and use the PR title instead when present
  in the body.
- **Co-authored commits**: surface contributor handles in a "Thanks" footer.
- **Breaking changes**: any commit body containing `BREAKING CHANGE:` gets
  its own section at the top with the full body quoted.

## Don't

- Don't run `git log` without a range — old repos will pull millions of lines.
- Don't summarize past `HEAD~500` without explicit user permission.
- Don't include hashes in the user-facing output unless asked; show short SHAs in a footnote table instead.
