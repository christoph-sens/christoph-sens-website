import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Blog posts, one Markdown file per post in src/content/blog/<lang>/. The file name is the URL slug,
 * so the entry id is "<lang>/<slug>". All language versions of a post share the same `key`.
 */
const blog = defineCollection({
  loader: glob({ pattern: '{de,en,es}/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    key: z.string(),
    category: z.enum(['success-story', 'article']),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
