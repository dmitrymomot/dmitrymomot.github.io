# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

Dmytro Momot's personal website and consulting portfolio built with Astro, featuring a blog and service offerings. The site outputs to `docs/` for GitHub Pages deployment.

## Prerequisites

- Node.js v25+ and npm

## Tech Stack

- **Framework**: Astro with TypeScript strict mode
- **Styling**: Tailwind CSS v4 via @tailwindcss/vite
- **Content**: Astro Content Collections (blog, pages, legal)
- **Integrations**: @astrojs/sitemap, remark-breaks
- **Deployment**: GitHub Pages from master branch `docs/` folder
- **Domain**: dmomot.com

## Development Commands

```bash
npm install          # or: make install
npm run dev          # or: make dev — starts dev server at http://localhost:4321
npm run build        # or: make build — outputs to docs/
npm run preview      # or: make preview — preview production build
make clean           # removes docs/ directory
make deploy          # builds and shows deployment instructions
make check           # verifies build configuration
```

## Directory Structure

```
src/
├── components/       # Footer.astro, Navbar.astro
├── content/
│   ├── blog/         # Blog posts (markdown)
│   ├── legal/        # Privacy policy, terms of service
│   ├── pages/        # Homepage content (home.md)
│   └── config.ts     # Collection schemas
├── layouts/          # Layout.astro (base layout)
├── pages/            # Astro page routes
└── styles/           # global.css (Tailwind imports)
```

## Content Architecture

### Content Collections (`src/content/config.ts`)

Three collections with strict schemas:

1. **Blog** (`src/content/blog/*.md`):
   - Required: `title`, `description`, `publishDate`
   - Optional: `tags[]`, `draft` (default: false)

2. **Pages** (`src/content/pages/*.md`):
   - Complex schema for homepage content including services, experience, contact info
   - Currently used for `home.md` which drives the main landing page

3. **Legal** (`src/content/legal/*.md`):
   - Required: `title`, `description`, `lastUpdated`
   - Contains `privacy.md` and `terms.md`

### Page Routes

- `/` - Homepage from `src/content/pages/home.md`
- `/blog/[...page]` - Paginated blog listing
- `/blog/[id]` - Individual blog posts
- `/blog/tags` - All tags page
- `/blog/tag/[tag]/[...page]` - Posts by tag
- `/privacy`, `/terms` - Legal pages via `[...legal].astro` catch-all
- `/uses` - Tools & setup page
- `/404` - Custom 404 page

## Adding Blog Posts

Create `src/content/blog/your-post.md`:

```markdown
---
title: "Your Post Title"  
description: "SEO description"
publishDate: 2025-08-26
tags: ["consulting", "architecture"]
draft: false
---

Content with markdown support including line breaks (via remark-breaks plugin).
```

## Key Configuration

- **astro.config.mjs**: Sets `outDir: './docs'`, configures sitemap and remark-breaks
- **public/CNAME**: Contains domain configuration (`dmomot.com`)
- **public/robots.txt**: Search engine directives
- **Makefile**: Provides convenient build/deploy commands

## Gotchas

- **Design file** — The .pen design file at `~/Documents/_Pencil_Design/dmomot-personal-website.pen` is the source of truth for visual design. Use Pencil MCP tools (`batch_get`, `get_screenshot`) to read it — never use `Read`/`Grep` on .pen files. Screen node IDs: Homepage `JJQ76`, Blog List `KmvYO`, Blog Topics `li0vE`, Blog By Topic `MoXIZ`, Blog Single Post `8X4Sh`, Uses `108wm`.
- **Fonts** — Three Google Fonts loaded in Layout.astro: Inter (body), Roboto Mono (mono/labels), Space Grotesk (headings/logo). Space Grotesk requires inline `style` attribute since no Tailwind utility class maps to it.
- **Container pattern** — Content constrained to `max-w-[1280px] mx-auto` per-section (not a global wrapper), so full-width backgrounds (e.g. Tech Stack `bg-[#1E2026]`) and dividers span the viewport. Sections with different bg use an outer element for color + inner div for max-width.
- **Icons** — All icons use Lucide outline style (`fill="none" stroke="currentColor" stroke-width="2"`), not filled brand SVGs. This applies to navbar social icons, CTA button icons, and card icons.
- **Homepage content lives in frontmatter** — `src/content/pages/home.md` frontmatter drives all homepage sections (hero, whatIDo cards, techStack, about). The template is `src/pages/index.astro`. Content changes go in the .md file; layout/style changes go in the .astro file.
- **`docs/` is committed to git** — it's the GitHub Pages deploy artifact, not a documentation folder. Don't add it to `.gitignore`.
- **Tailwind v4** — uses `@tailwindcss/vite` plugin (not PostCSS). CSS imports go through `src/styles/global.css`.
- **Content loaders** — collections use `glob()` loader pattern (Astro v5 style), not the legacy file-based routing.
- **Uses page data is hardcoded** — Unlike homepage (content collection), `src/pages/uses.astro` has all tools/setup data hardcoded in the frontmatter. Edit the `.astro` file directly to update items.
- **Blog single post prev/next** — `src/pages/blog/[id].astro` computes `prevPost`/`nextPost` in `getStaticPaths` by sorting all posts by date. The oldest post has no "previous" and the newest has no "next".
- **Blog list pattern** — All blog listing pages (main `[...page].astro`, by-tag) use the same flat-row layout: date on left, content on right, `border-t border-[#2A2B30]` row separator. Keep this consistent when adding new listing pages.
- **Prose styles** — `.prose-custom` in `global.css` styles article body content. Blockquotes have green left border + `#1E2026` bg, h2 is Space Grotesk 26px. Modify `global.css` to change article rendering.
- **Blog post lead paragraph** — The post description is rendered explicitly as an italic lead paragraph above a green divider in `[id].astro`, not via CSS `:first-child`. The prose block starts after the divider.

## Design System Tokens

All pages follow a minimal, terminal-inspired design:
- **Backgrounds**: `#16171B` (main), `#1E2026` (alternate sections)
- **Dividers**: `<div class="h-px bg-[#2A2B30]"></div>` full-width between sections
- **Section labels**: `font-mono text-[11px] font-semibold text-[#71717A]` (e.g. `// BLOG`)
- **Headings**: Space Grotesk via inline `style`, color `#F4F4F5`
- **Body text**: Inter, `#71717A` (secondary) or `#A1A1AA` (article body)
- **Mono text**: Roboto Mono — dates, labels, tags, breadcrumbs
- **Green accent**: `#22C55E` (active nav, labels, highlights, blockquote borders)
- **Tags**: `border border-[#3F3F46] rounded-sm px-2 py-0.5 font-mono text-[10px] text-[#52525B]`
- **Borders**: `#2A2B30` (dividers, card outlines), `#3F3F46` (tag/pill borders)
- **Container**: `max-w-[1280px] mx-auto` per section, `px-6 lg:px-[120px]`
- **Pagination**: green active (`bg-[#22C55E] text-[#16171B]`), bordered inactive (`border border-[#2A2B30]`)