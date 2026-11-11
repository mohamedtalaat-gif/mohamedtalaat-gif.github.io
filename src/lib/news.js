// The News feed, computed from everything on the site that has a date. Nothing is listed by hand:
//   - every blog post (a post with `news: false` in its front matter is left out),
//   - every activity, course and conference that no post already tells,
//   - the validation reports, one line for each day.
// An entry is "told by a post" when a post of the same kind is dated the same day (or the same month or year, when the entry
// gives no more) and the two share words, so that adding an activity and its post does not list the event twice. Entries
// without a post are listed on their own and link to their certificate, DOI or repository.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Words that say what kind of thing an entry is, not which one, and so do not show that two entries are about the same event.
const COMMON = new Set([
  'about', 'after', 'course', 'courses', 'certificate', 'conference', 'department', 'faculty', 'first', 'hours', 'online', 'paper',
  'pharmaceutical', 'published', 'program', 'programme', 'research', 'session', 'their', 'there', 'these', 'those', 'university',
  'which', 'with', 'would', 'from', 'that', 'this', 'into', 'over', 'also', 'have', 'more', 'than', 'were', 'been',
]);

/** "2026", "2026-09", "2026-09-30", "30 Sep 2026" and "Sep 2026" become ISO prefixes; anything else is returned as it is. */
export function isoDate(value) {
  const s = String(value ?? '').trim();
  if (/^\d{4}(-\d{2}){0,2}$/.test(s)) return s;
  let m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/);
  if (m && MONTHS.includes(m[2].toLowerCase())) return `${m[3]}-${String(MONTHS.indexOf(m[2].toLowerCase()) + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = s.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/);
  if (m && MONTHS.includes(m[1].toLowerCase())) return `${m[2]}-${String(MONTHS.indexOf(m[1].toLowerCase()) + 1).padStart(2, '0')}`;
  return s;
}

const stem = (w) => w.replace(/(ing|s)$/, '');
/** The words of a text that can tell one event from another: five letters or more, not a common word, without a plural. */
export function keywords(text) {
  const out = new Set();
  for (const w of String(text ?? '').toLowerCase().match(/[a-z0-9]{5,}/g) ?? []) if (!COMMON.has(w)) out.add(stem(w));
  return out;
}

const related = (a, b) => a === b || a.startsWith(b) || b.startsWith(a);

/** Does `post` tell the same event as `entry` ({ date, kind, title })? Same kind, a related date and shared words. */
export function isTold(entry, post) {
  if (entry.kind !== post.topic || !related(isoDate(entry.date), isoDate(post.date))) return false;
  const mine = keywords(entry.title);
  if (mine.size === 0) return false;
  const theirs = keywords(`${post.title} ${post.summary} ${post.text ?? ''}`);
  const shared = [...mine].filter((w) => theirs.has(w)).length;
  return shared >= Math.min(2, mine.size);
}

const ORDER = { post: 0, activity: 1, course: 2, conference: 3, report: 4 };

/**
 * @param {{ posts: any[], activities?: any[], courses?: any[], conferences?: any[], reports?: any[] }} src
 * @returns {{ date: string, title: string, summary: string, href: string, kind: string, source: string, minutes?: number, slug?: string }[]}
 */
export function buildNews({ posts = [], activities = [], courses = [], conferences = [], reports = [] }) {
  const items = [];
  const shown = posts.filter((p) => p.news !== false);
  for (const p of shown) {
    items.push({ date: p.date, title: p.title, summary: p.summary ?? '', href: `/blog/${p.slug}/`, kind: p.topic ?? 'post', source: 'post', minutes: p.minutes, slug: p.slug });
  }
  const told = (e) => posts.some((p) => isTold(e, p)); // a post that is hidden from the news still tells the event
  for (const a of activities) {
    if (!told(a)) items.push({ date: a.date, title: a.title, summary: a.text ?? '', href: a.href ?? '/activities/', kind: a.kind, source: 'activity' });
  }
  for (const c of courses) {
    const e = { date: String(c.year), kind: 'course', title: c.title };
    if (!told(e)) items.push({ date: e.date, title: c.title, summary: c.by ?? '', href: c.href ?? '/activities/', kind: 'course', source: 'course' });
  }
  for (const c of conferences) {
    const e = { date: isoDate(c.date), kind: 'event', title: c.title };
    if (!told(e)) items.push({ date: e.date, title: c.title, summary: [c.text, c.place].filter(Boolean).join(' '), href: '/activities/', kind: 'event', source: 'conference' });
  }
  // validation reports: one line for each day, so that a batch of reports is one piece of news
  const byDay = new Map();
  for (const r of reports) byDay.set(r.date, [...(byDay.get(r.date) ?? []), r]);
  for (const [date, list] of byDay) {
    if (list.length === 1) items.push({ date, title: list[0].title, summary: list[0].summary ?? '', href: `/validation/${list[0].slug}/`, kind: 'report', source: 'report' });
    else items.push({ date, title: `${list.length} validation reports`, summary: `${list.map((r) => r.title).join('; ')}.`, href: '/validation/', kind: 'report', source: 'report' });
  }
  return items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : ORDER[a.source] - ORDER[b.source] || a.title.localeCompare(b.title)));
}

/** A short label for the kind of an item, for the line under its summary. */
export const kindLabel = (item) => (item.kind === 'report' ? 'Validation report' : item.kind[0].toUpperCase() + item.kind.slice(1));
