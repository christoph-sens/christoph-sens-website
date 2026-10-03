import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/** Blog posts (German), one Markdown file per post in src/content/blog. The file name is the URL slug. */
const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.enum(['success-story', 'article']),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
