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

- **`docs/` is committed to git** — it's the GitHub Pages deploy artifact, not a documentation folder. Don't add it to `.gitignore`.
- **Tailwind v4** — uses `@tailwindcss/vite` plugin (not PostCSS). CSS imports go through `src/styles/global.css`.
- **Content loaders** — collections use `glob()` loader pattern (Astro v5 style), not the legacy file-based routing.