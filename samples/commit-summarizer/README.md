# Commit Summarizer

A Claude Skill that turns recent git history into a ready-to-paste changelog.

## Install

```bash
git clone https://github.com/<your-handle>/commit-summarizer ~/.claude/skills/commit-summarizer
```

Restart Claude Code so it picks up the new skill.

## Use

Tell Claude:
> "Summarize commits since last Monday"
>
> "Draft release notes for the last 30 commits"
>
> "What shipped this week?"

The skill reads the last 50 commits (or last 7 days), buckets them by conventional-commit type, and emits Markdown release notes.

## Permissions

The skill declares `Bash(git log:*)` and `Bash(git diff:*)` in its frontmatter — Claude will ask before running anything outside that allowlist.

## License

MIT
