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

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    tagline: z.string().optional(),
    description: z.string().optional(),
    status: z.object({
      available: z.boolean(),
      text: z.string(),
      color: z.enum(['green', 'yellow', 'red', 'gray']),
    }).optional(),
    problemsSolve: z.object({
      title: z.string(),
      intro: z.string(),
      items: z.array(z.string()),
      outro: z.string(),
    }).optional(),
    services: z.object({
      title: z.string(),
      categories: z.array(z.object({
        title: z.string(),
        items: z.array(z.string()),
      })).optional(),
      items: z.array(z.object({
        title: z.string(),
        description: z.string(),
      })).optional(),
    }).optional(),
    howIWork: z.object({
      title: z.string(),
      subtitle: z.string(),
      engagements: z.array(z.object({
        title: z.string(),
        description: z.string(),
      })),
      principles: z.object({
        title: z.string(),
        intro: z.string(),
        items: z.array(z.string()),
      }),
    }).optional(),
    experience: z.object({
      title: z.string(),
      leadership: z.object({
        title: z.string(),
        items: z.array(z.string()),
      }),
      technical: z.object({
        title: z.string(),
        items: z.array(z.string()),
      }),
      stats: z.string(),
    }).optional(),
    about: z.object({
      title: z.string(),
      content: z.string(),
      location: z.string().optional(),
      serving: z.string().optional(),
    }).optional(),
    contact: z.object({
      title: z.string(),
      intro: z.string(),
      content: z.string(),
      email: z.string(),
      calendlyLink: z.string().optional(),
    }).optional(),
    social: z.object({
      github: z.string().optional(),
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
      email: z.string().optional(),
    }).optional(),
    footer: z.object({
      tagline: z.string(),
      copyright: z.string(),
    }).optional(),
  }),
});

export const collections = { blog, pages };