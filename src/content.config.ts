import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Blog posts, one Markdown file per post in src/content/blog/<lang>/. The file name is the URL slug,
 * so the entry id is "<lang>/<slug>". `translation` is the slug of the same post in the other language.
 */
const blog = defineCollection({
  loader: glob({ pattern: '{de,en}/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    translation: z.string(),
    category: z.enum(['success-story', 'article']),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
