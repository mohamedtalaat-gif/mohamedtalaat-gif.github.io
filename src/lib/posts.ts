import { readingMinutes } from './reading';

// Every blog post, with its reading time computed from the text. Adding a markdown file to src/content/blog is enough:
// the blog, the News page (src/lib/feed.ts) and the home page pick it up and show the minutes automatically.
const meta = import.meta.glob('../content/blog/*.md', { eager: true }) as Record<string, any>;
const raw = import.meta.glob('../content/blog/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

export interface Post {
  slug: string;
  title: string;
  date: string;
  summary: string;
  /** false only when the post says `news: false`; every other post is news */
  news: boolean;
  topic?: string;
  minutes: number;
  /** the whole file, used to tell whether an activity is the same event as the post */
  text: string;
}

const iso = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));

export const posts: Post[] = Object.entries(meta)
  .filter(([, m]) => !m.frontmatter.draft)
  .map(([file, m]) => ({
    slug: file.split('/').pop()!.replace(/\.md$/, ''),
    title: m.frontmatter.title,
    date: iso(m.frontmatter.date),
    summary: m.frontmatter.summary ?? '',
    news: m.frontmatter.news !== false,
    topic: m.frontmatter.topic,
    minutes: readingMinutes(raw[file]),
    text: raw[file],
  }))
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)));

export const yearsOf = (list: { date: string }[]) => [...new Set(list.map((p) => p.date.slice(0, 4)))];
