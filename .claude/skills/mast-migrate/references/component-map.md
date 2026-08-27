# Webflow export → Astro component map

Every mapping below goes from the markup you'll see in a Webflow export
of a Mast site to this repo's Astro API. Class names carry over — what
changes is the wrapper elements and where behavior comes from. Props not
mentioned have sensible defaults; check the component's `interface
Props` (each one is documented) when the export does something unusual.

## Structure

| Export markup | Astro |
| --- | --- |
| `<section class="section [cc-alt]"><div class="container">…` | `<Section [theme="alt"]>…` — `tag="header"` for the page hero, `contained={false}` when the export had no `.container` |
| `<div class="row [row-justify-… row-align-… row-gap-…]">` | `<Row justify="…" align="…" gap="main\|md\|sm\|button\|0">` |
| `<div class="col col-6 [col-md-12 …]">` | `<Col size={6}>` — smart stacking is automatic; add `lg/md/sm/xs` only where the export's per-breakpoint classes differ from it. `col-shrink` → `size="shrink"` |
| `<div class="content-wrap [cc-center\|cc-left]">` | `<ContentWrap align="center\|left">` |
| `<div class="spacer-component [cc-sm\|cc-md\|cc-lg]">` | `<Spacer size="sm\|md\|main\|lg" />` |
| divider `u-border` div | `<Divider size="…" />` |
| Scroll-in stagger (Webflow IX on section children) | `animate` prop on `Section`/`Row`/`Col`/`ContentWrap` |

Plain HTML that stays plain HTML: headings (`<h2 class="h1">`),
`.eyebrow [cc-rule]`, `.rich-text`, `.paragraph-sm/-lg/-xl`, lists,
plain `<a>` text links.

## Cards, buttons, media

| Export markup | Astro |
| --- | --- |
| `<a class="button [cc-secondary]">Text<div class="btn-icon">…svg…</div></a>` | `<Button href variant="secondary">Text<span class="btn-icon"><Icon name="arrow-right" /></span></Button>` |
| `<div class="card [cc-hover]">` + cover link (`u-link-cover`) | `<Card hover href="…" linkLabel="…">` — cover link is generated; don't copy the export's |
| `<div class="card-body">` | `<CardBody>` |
| `<div class="img-component [cc-16x9…]"><img …>` | `<Img src alt ratio="16x9\|1x1\|…\|bg" position="top-left…" srcset sizes />` — `ratio="bg"` for full-bleed backgrounds (+ `overlay` for the text-contrast layer) |
| Phosphor icon font `<div class="icon ph ph-cube">` | `<Icon name="cube" size="base\|md\|lg\|xl" color="accent\|yellow\|blue" />` — build-time inline SVG; the `ph ph-*` font classes die with the icon font |

## Interactive components

Config in the export lives in `data-*` attributes; those become props.

**Slider** — export: `[data-slider="component"]` wrapping
`[data-slider="slider"].swiper` with `data-loop/-autoplay/-centered/
-effect/-speed/-grab-cursor/-slider-overflow/-loop-additional-slides`,
plus `--lg/--md/--sm/--xs/--gap` style vars for slides-per-view.

```astro
<Slider lg={3} md={2} sm={1} xs={1} gap="md" overflow
        loop loopAdditionalSlides={1} autoplay={4000}
        effect="fade" speed={1200}
        navPosition="bottom|top|overlay|header" label="Latest posts">
  <Slide>…card markup…</Slide>
</Slider>
```

Arrows/pagination are generated from `navPosition`/`arrows`/
`pagination` — don't copy the export's `slider-nav` markup.
`navPosition="header"` puts arrows beside a `slot="header"` heading.

**Tabs** — export: `[data-tabs-component]` with menu/link/pane
attributes and `data-tabs-autoplay*` config.

```astro
<Tabs tabs={["One", "Two"]} mobileDropdown autoplay autoplayDuration={8}
      autoplayHoverPause autoplayToggle vertical>
  <TabPane>…</TabPane>
  <TabPane>…</TabPane>
</Tabs>
```

Tab labels come from the `tabs` prop (use `{ label, id }` entries when
the export used ids for deep linking). The whole menu apparatus is
generated. If a design demands fully custom tab-link markup, copy the
hand-rolled pattern in `src/pages/inspired-layouts.astro` instead.

**Accordion** — export: `<details data-accordion…>` blocks →
`<Accordion title="…" name="group" startOpen>` with the answer as
children. Exclusive groups use the shared `name`, exactly like the
native attribute.

**Modal** — export: `dialog` + adjacent trigger button →
`<Modal id="…" label="…" triggerLabel="…" openOnLoad cooldownDays={7}>`
with the dialog content as children (close button generated).

**Inline video** — export: `video[data-video]` with poster img and
playback buttons → `<InlineVideo src poster posterSrcset posterSizes
ratio="16 / 9" scrollInPlay|hoverPlay desktopOnly loop />`. `src` may
stay on the Webflow CDN or move to self-hosting — ask/decide, don't
silently keep CDN URLs on a site that's leaving Webflow.

**Marquee** — export: `data-marquee-*` wrapper with duplicated content
→ `<Marquee duration={30} reverse pauseOnHover fadeEdges vertical>` with
the content ONCE (the seamless duplicate is generated). CSS-only — no
script.

**Nav & footer** — export nav markup →

```astro
<Fragment slot="nav">
  <NavBanner href="…">Announcement</NavBanner>
  <Nav>
    <a href="…" class="nav-link">Link</a>
    <NavDropdown label="Drop">…nav-link cc-dropdown-link items…</NavDropdown>
    <NavDropdown label="Mega" mega>…Row/Col grid…</NavDropdown>
    <Button slot="cta" href="…">CTA</Button>
  </Nav>
</Fragment>
<Footer slot="footer" />
```

Hamburger, skip link, and dropdown behavior are generated. `Footer`'s
link grid is demo chrome — rewrite its contents for the migrated site
(copy `Footer.astro` into the project's own component if the layout
differs).

**Forms** — export `w-form` wrapper →
`<Form action="…" method="post" requiredNote="*Required">` containing
`<Field label id type="text|email|tel|number|password|textarea|select"
placeholder required options={…} />` and
`<Choice type="checkbox|radio" label id name />`, plus a
`<Button type="submit">`. Webflow's submission endpoint is gone —
`action` must point at the site's new handler, and the success/error
blocks are toggled by that handler, not the framework.

**Theme toggle** — export checkbox toggle → `<ThemeToggle />`. The
saved-mode bootstrapping is already in `BaseHead`.

## Utility & variant classes

`u-*` and `cc-*` classes carry over verbatim — they are the same API.
Two renames to know: there are none; if a class from the export has no
match in `src/styles/`, it was site-specific custom CSS (migrate the
rule) or Webflow runtime (`w-*` — delete).
