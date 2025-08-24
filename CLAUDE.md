# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is Dmytro Momot's personal website built with Astro v5.13.3, showcasing professional experience and consulting services. The site transitioned from a custom Go-based static site generator to Astro for better flexibility and markdown blog support.

## Tech Stack

- **Framework**: Astro v5.13.3 with TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (via @tailwindcss/vite)
- **Content Management**: Astro Content Collections for blog posts
- **Deployment**: GitHub Pages (master branch)
- **Domain**: dmomot.com (configured via CNAME in public/)

## Development Commands

```bash
# Start development server on http://localhost:4321
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
git add . && git commit -m "Update site" && git push origin master
```

## Architecture

### Content Collections

Blog posts are managed through Astro's content collections system:

- **Location**: `src/content/blog/*.md`
- **Schema**: Defined in `src/content/config.ts` with required fields:
    - `title`: string
    - `description`: string
    - `publishDate`: date
    - `tags`: string array
    - `draft`: boolean (defaults to false)

### Page Structure

- **Main page** (`src/pages/index.astro`): Landing page with services and about info
- **Blog listing** (`src/pages/blog/index.astro`): Lists all published blog posts
- **Blog posts** (`src/pages/blog/[id].astro`): Dynamic route for individual posts

### Layout System

- **Base layout** (`src/layouts/Layout.astro`): Provides HTML structure, meta tags, and Tailwind styles
- Supports dark mode via Tailwind's dark: variant classes
- All pages import and use this layout for consistency

## Adding Blog Posts

Create a new `.md` file in `src/content/blog/` with this frontmatter:

```markdown
---
title: "Post Title"
description: "Brief description for SEO and previews"
publishDate: 2025-08-24
tags: ["tag1", "tag2"]
draft: false
---

Your markdown content here...
```

Posts with `draft: true` won't appear in the blog listing.

## GitHub Pages Deployment

The site deploys automatically when pushing to the master branch. The CNAME file in `public/` configures the custom domain.

## Previous Content Backup

The original Go-based site content is backed up in `backup-old-site/`:

- `config.yml`: Contains all previous site content (services, projects, expertise)
- `assets/`: Original static assets
- This content can be migrated into the new Astro structure as needed
