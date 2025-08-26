# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

Dmytro Momot's personal website and consulting portfolio built with Astro, featuring a blog and service offerings. The site outputs to `docs/` for GitHub Pages deployment.

## Tech Stack

- **Framework**: Astro v5.13.3 with TypeScript strict mode
- **Styling**: Tailwind CSS v4 via @tailwindcss/vite
- **Content**: Astro Content Collections (blog posts and pages)
- **Deployment**: GitHub Pages from master branch `docs/` folder
- **Domain**: dmomot.com

## Development Commands

```bash
# Development server (http://localhost:4321)
npm run dev
# or
make dev

# Build to docs/ directory for GitHub Pages
npm run build
# or
make build

# Preview production build
npm run preview
# or
make preview

# Deploy workflow
make deploy  # Builds and shows deployment instructions
git add docs && git commit -m "Deploy site" && git push origin master

# Check build configuration
make check
```

## Content Architecture

### Content Collections (`src/content/config.ts`)

Two collections with strict schemas:

1. **Blog** (`src/content/blog/*.md`):
   - Required: `title`, `description`, `publishDate`
   - Optional: `tags[]`, `draft` (default: false)

2. **Pages** (`src/content/pages/*.md`):
   - Complex schema for homepage content including services, experience, contact info
   - Currently used for `home.md` which drives the main landing page

### Page Routes

- `/` - Homepage from `src/content/pages/home.md`
- `/blog/[...page]` - Paginated blog listing
- `/blog/[id]` - Individual blog posts
- `/blog/tags` - All tags page
- `/blog/tag/[tag]/[...page]` - Posts by tag

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

- **astro.config.mjs**: Sets `outDir: './docs'` for GitHub Pages
- **public/CNAME**: Contains domain configuration
- **Makefile**: Provides convenient build/deploy commands