import { blogEntries } from './blog';
import { feeds, routes, ui, type Lang } from '../i18n/ui';

const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** RSS 2.0 feed with all blog entries of one language (posts and success stories), newest first. */
export async function feedResponse(lang: Lang, site: URL): Promise<Response> {
  const t = ui[lang].blog;
  const entries = await blogEntries(lang);
  const items = entries.map((entry) => {
    const link = new URL(entry.href, site).href;
    return `    <item>
      <title>${escape(entry.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${entry.date.toUTCString()}</pubDate>
      <description>${escape(entry.description)}</description>
    </item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(t.title)}</title>
    <link>${new URL(routes.blog[lang], site).href}</link>
    <description>${escape(t.description)}</description>
    <language>${lang}</language>
    <atom:link href="${new URL(feeds[lang], site).href}" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
