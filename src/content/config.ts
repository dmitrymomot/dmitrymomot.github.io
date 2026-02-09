import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lastUpdated: z.coerce.date(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),

    hero: z.object({
      label: z.string(),
      role: z.string(),
      tagline: z.string(),
      ctas: z.array(z.object({
        text: z.string(),
        url: z.string(),
        icon: z.string().optional(),
        style: z.enum(['filled', 'outline']),
      })),
    }),

    whatIDo: z.array(z.object({
      icon: z.string(),
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
    })),

    techStack: z.array(z.object({
      title: z.string(),
      items: z.array(z.object({
        name: z.string(),
        primary: z.boolean().default(true),
      })),
    })),

    about: z.object({
      title: z.string(),
      paragraphs: z.array(z.string()),
      principles: z.array(z.string()),
      location: z.object({
        city: z.string(),
        detail: z.string(),
      }),
    }),

    social: z.object({
      github: z.string().optional(),
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
      email: z.string().optional(),
    }).optional(),
  }),
});

export const collections = { blog, legal, pages };
