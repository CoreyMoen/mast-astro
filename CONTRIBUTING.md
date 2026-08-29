# Contributing

Thanks for your interest in contributing! This is the Astro edition of the
[Mast](https://nocodesupply.co/mast) CSS framework, plus the style guide that
documents it.

## Getting started

1. Fork and clone the repository
2. Install dependencies: `npm install` (Node 22.12+ required)
3. Start the dev server: `npm run dev` (http://localhost:4321)

## Before submitting a PR

Run the same checks CI runs:

```bash
npm run check          # astro check — must stay at 0 errors
npm run build          # static build to dist/
npm run format:check   # prettier
```

Run `npm run format` to fix formatting.

## Guidelines

- **As little abstraction as possible.** Prefer deleting a layer over adding
  one. Classes are the styling API; components exist for structure and
  behavior. There are intentionally no wrapper components for headings, rich
  text, or eyebrows.
- Variant classes are `cc-*`; utilities are `u-*` and always win. No
  `!important` outside of documented exceptions.
- Theming is `light-dark()` + `color-scheme`. Never branch on a theme class in
  CSS — add a token in `src/styles/tokens.css` instead.
- When changing framework CSS, check the rendered result: build, screenshot,
  and compare in light, dark, and at 390px mobile. `playwright-core` is in
  devDependencies for driving the preview server headlessly.
- Interactive behaviors keep the same `data-*` attribute APIs as the upstream
  [Mast scripts](https://github.com/nocodesupplyco/mast).
- Keep PRs focused — one feature or fix per PR — and update the docs when
  behavior changes.

[docs/building-with-mast.md](docs/building-with-mast.md) explains the
conventions above and why they exist — read it before framework work.
[CLAUDE.md](CLAUDE.md) covers the repo architecture.

## Reporting issues

Open an issue at [GitHub Issues](https://github.com/CoreyMoen/mast-astro/issues)
with reproduction steps. For security issues, see [SECURITY.md](SECURITY.md).
