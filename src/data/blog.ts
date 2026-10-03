import { getCollection } from 'astro:content';
import { blogPath, routes } from '../i18n/ui';
import { stories, type StoryKey } from './stories';

export type BlogCategory = 'success-story' | 'article';

export interface BlogEntry {
  title: string;
  description: string;
  date: Date;
  category: BlogCategory;
  href: string;
}

/** Success stories that have their own designed page (and an English version) instead of a blog post. */
const storyPages: { story: StoryKey; date: string }[] = [
  { story: 'storyKotlin', date: '2026-08-03' },
  { story: 'storyPdf', date: '2024-06-14' },
];

export const categoryLabels: Record<BlogCategory, string> = {
  'success-story': 'Success Story',
  article: 'Fachartikel',
};

export const formatDate = (date: Date) =>
  date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

/** All blog entries (Markdown posts plus the story pages), newest first. */
export async function blogEntries(): Promise<BlogEntry[]> {
  const posts = (await getCollection('blog')).map((post) => ({
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    category: post.data.category,
    href: `${blogPath}${post.id}/`,
  }));
  const pages = storyPages.map(({ story, date }) => ({
    title: stories[story].de.title,
    description: stories[story].de.teaser,
    date: new Date(date),
    category: 'success-story' as const,
    href: routes[story].de,
  }));
  return [...posts, ...pages].sort((a, b) => b.date.getTime() - a.date.getTime());
}
