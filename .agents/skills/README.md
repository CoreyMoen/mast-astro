# Agent skills

The skills in this directory teach an AI coding agent how to work with Mast
for Astro. They are plain [Agent Skills](https://agentskills.io) — a folder
per skill containing `SKILL.md` (YAML frontmatter with `name` and
`description`, then Markdown instructions) plus optional `references/`.
Nothing here is Claude-specific.

| Skill | Use it for |
|---|---|
| `mast-build` | Building and extending anything in this project — pages, sections, custom classes, tokens, component scripts. Encodes Mast's class system, nomenclature, theming rules, and extension patterns. |
| `mast-migrate` | Converting a Mast for Webflow site or export into this Astro project, including CMS collections. |

## Why this directory

`.agents/skills/` is the cross-agent convention: Gemini CLI reads it as an
alias for `.gemini/skills/` and describes it as "an interoperable path…
compatible across different AI tools", and skills installed by Codex, Cursor,
OpenCode and others land there too.

Claude Code discovers skills in `.claude/skills/` rather than here, and does
not yet read `.agents/skills/` directly. Rather than keep two copies in sync,
`.claude/skills/<name>` is a **symlink** to the real skill in this directory.
Claude Code [officially supports symlinked skill entries](https://code.claude.com/docs/en/skills)
and follows them to read `SKILL.md` from the target. One source of truth, two
discovery paths.

`AGENTS.md` in the repo root is likewise a symlink to `CLAUDE.md`, so agents
following either convention get the same project instructions.

**Windows note:** git only materializes symlinks when `core.symlinks` is
enabled (the default on macOS and Linux, but not always on Windows). If the
symlinks come through as plain text files, either enable it
(`git config core.symlinks true` and re-checkout) or point your agent at
`.agents/skills/` directly.

## Adding a skill

Create the folder here, then link it for Claude Code:

```sh
ln -s ../../.agents/skills/<name> .claude/skills/<name>
```

Keep `SKILL.md` to the portable core of the spec — `name`, `description`, and
a Markdown body — so the skill works across agents. Put anything long in
`references/` and point to it from `SKILL.md`, so it only loads when needed.
