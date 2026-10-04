import { getCollection, type CollectionEntry } from 'astro:content';
import { languages, routes, ui, type Lang } from '../i18n/ui';
import { stories, type StoryKey } from './stories';

export type BlogCategory = 'success-story' | 'article';
type Post = CollectionEntry<'blog'>;

export interface BlogEntry {
  title: string;
  description: string;
  date: Date;
  category: BlogCategory;
  href: string;
}

/** Success stories that have their own designed page (in both languages) instead of a blog post. */
const storyPages: { story: StoryKey; date: string }[] = [
  { story: 'storyKotlin', date: '2026-08-03' },
  { story: 'storyPdf', date: '2024-06-14' },
];

export const formatDate = (date: Date, lang: Lang) =>
  date.toLocaleDateString(ui[lang].blog.locale, { day: 'numeric', month: 'long', year: 'numeric' });

/** Entry ids are "<lang>/<slug>" (see content.config.ts). */
export const postLang = (post: Post) => post.id.split('/')[0] as Lang;
export const postSlug = (post: Post) => post.id.split('/')[1];
export const postHref = (post: Post) => `${routes.blog[postLang(post)]}${postSlug(post)}/`;

export const postsIn = async (lang: Lang) => (await getCollection('blog')).filter((post) => postLang(post) === lang);

/** URL of the post in every language. Fails the build if a translation link points nowhere. */
export async function postAlternates(post: Post): Promise<Record<Lang, string>> {
  const all = await getCollection('blog');
  const lang = postLang(post);
  const entries = languages.map((l) => {
    if (l === lang) return [l, postHref(post)];
    const translation = all.find((p) => p.id === `${l}/${post.data.translation}`);
    if (!translation) throw new Error(`Blog post ${post.id}: no ${l} translation "${post.data.translation}"`);
    return [l, postHref(translation)];
  });
  return Object.fromEntries(entries);
}

/** All blog entries of one language (Markdown posts plus the story pages), newest first. */
export async function blogEntries(lang: Lang): Promise<BlogEntry[]> {
  const posts = (await postsIn(lang)).map((post) => ({
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    category: post.data.category,
    href: postHref(post),
  }));
  const pages = storyPages.map(({ story, date }) => ({
    title: stories[story][lang].title,
    description: stories[story][lang].teaser,
    date: new Date(date),
    category: 'success-story' as const,
    href: routes[story][lang],
  }));
  return [...posts, ...pages].sort((a, b) => b.date.getTime() - a.date.getTime());
}
