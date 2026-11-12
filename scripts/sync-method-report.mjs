// The interactive method report: a blog post that is built from METHOD_REPORT.md of the CYPMode repository.
//
// `npm run build` and `npm run dev` run this script first (the "prebuild" and "predev" entries of package.json). It reads the report from the
// main branch of the repository, so an edit to the report there reaches this site with the next build (every push to this repository and every
// six hours, see .github/workflows/pages.yml). Nothing of the report is copied by hand, and the post is not committed.
//
//   METHOD_REPORT_SOURCE=/path/to/METHOD_REPORT.md npm run dev     read a local file or another URL instead of the repository
//
// If the repository cannot be read, the last good copy in src/data/method-report.snapshot.md is used, so a network failure never removes the post.
// A file that does not look like the report is refused, so a broken upload cannot be published.

import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPOSITORY = 'mohamedtalaat-gif/CYPMode';
export const SOURCE_URL = `https://raw.githubusercontent.com/${REPOSITORY}/main/METHOD_REPORT.md`;
export const BLOB_URL = `https://github.com/${REPOSITORY}/blob/main/`;
export const RAW_URL = `https://raw.githubusercontent.com/${REPOSITORY}/main/`;
export const PUBLISHED = '2026-11-12';
export const WORDS_PER_MINUTE = 200;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT = path.join(ROOT, 'src/data/method-report.snapshot.md');
const OUTPUT = path.join(ROOT, 'src/content/blog/cypmode-interactive-method-report.md');
const FRESH_MS = 10 * 60 * 1000; // a second build in the same deploy (the link previews) does not read the repository again

/** Words of a piece of Markdown, counted like the reading time of the site (code fences left out). */
export function words(markdown) {
  const text = markdown.replace(/```[\s\S]*?```/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) ?? []).length;
}

/** The heading text as a lower-case address: letters, digits, and single hyphens. */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/** A heading with its number taken out: "12. Negative results" gives { number: "12", title: "Negative results" }. */
export function numbered(title) {
  const m = title.match(/^(\d+)\.\s+(.*)$/);
  return m ? { number: m[1], title: m[2] } : { number: '', title };
}

/** The name of a section in the catalogue beside the page: the title before any colon or bracket, cut at a word near 30 characters. */
export function shortLabel(title) {
  let t = title.split(/\s*[:(]/)[0].trim();
  if (t.length <= 30) return t;
  const cut = t.slice(0, 30);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 12 ? cut.lastIndexOf(' ') : 30)}…`;
}

/** The report split at its headings of level one and two. Lines inside a code fence are never headings. */
export function parse(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let fence = null;
  const parts = [{ level: 1, title: '', lines: [] }];
  for (const line of lines) {
    const f = line.match(/^\s*(```+|~~~+)/);
    if (f) {
      if (!fence) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
    }
    const h = !fence && line.match(/^(#{1,2}) +(.+?)\s*#*\s*$/);
    if (h) parts.push({ level: h[1].length, title: h[2].trim(), lines: [] });
    else parts[parts.length - 1].lines.push(line);
  }
  const first = parts[0].level === 1 && parts[0].title === '' ? parts.shift() : null;
  const title = parts[0]?.level === 1 ? parts.shift() : null;
  return {
    title: title?.title ?? '',
    intro: [...(first?.lines ?? []), ...(title?.lines ?? [])].join('\n').trim(),
    sections: parts.filter((p) => p.level === 2).map((p) => ({ title: p.title, body: p.lines.join('\n').trim() })),
  };
}

/** The report must look like the report before it is published. */
export function looksLikeTheReport(markdown) {
  return markdown.length > 20000 && /^# .*[Mm]ethod report/m.test(markdown) && (markdown.match(/^## /gm) ?? []).length >= 8;
}

const yaml = (value) => JSON.stringify(value); // JSON is valid YAML, and escapes every character that YAML would need escaped

/** Relative links of the report point into the repository, so they become links to the files on GitHub. */
export function absoluteLinks(markdown) {
  return markdown.replace(/(?<!!)\[([^\]]+)\]\((?!https?:|#|mailto:)([^)\s]+)\)/g, (_, text, target) => `[${text}](${BLOB_URL}${target.replace(/^\.\//, '')})`);
}

/** House style for a negative number: the minus sign (U+2212) instead of a hyphen, outside code spans and code fences. A hyphen between digits (a range or a date) stays. */
export function typographicMinus(markdown) {
  let fence = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fence = !fence;
        return line;
      }
      if (fence) return line;
      return line
        .split(/(`[^`]*`)/)
        .map((part, i) => (i % 2 ? part : part.replace(/(^|[\s(|;,=<>])-(?=\d)/g, '$1\u2212')))
        .join('');
    })
    .join('\n');
}

/** The catalogue of the figures of the repository (docs/figures/CATALOG.md): each "### id: title" entry, with its directory and its first paragraph. */
export function parseCatalog(markdown) {
  const figures = new Map();
  let dir = '';
  let current = null;
  for (const line of markdown.split('\n')) {
    let m;
    if ((m = line.match(/^## (\S+)\s*$/))) {
      dir = m[1];
      current = null;
    } else if ((m = line.match(/^### ([A-Za-z0-9_]+): (.+?)\s*$/))) {
      current = { id: m[1], title: m[2], dir, description: '' };
      figures.set(current.id, current);
    } else if (current && !current.description && line.trim() && !line.startsWith('- ') && !line.startsWith('#')) {
      current.description = line.trim();
    }
  }
  return figures;
}

/** The figures that a piece of text names: a file name such as `docs/figures/architecture/arch_a-light.png` (with or without the folder), or the words figure `id`. */
export function findFigureIds(text, catalog) {
  const ids = [];
  const add = (id) => {
    if (catalog.has(id) && !ids.includes(id)) ids.push(id);
  };
  for (const m of text.matchAll(/`(?:[\w./-]*\/)?([A-Za-z0-9_]+)-(?:light|dark)\.(?:png|svg)`/g)) add(m[1]);
  for (const m of text.matchAll(/\bfigures? `([A-Za-z0-9_]+)`/g)) add(m[1]);
  return ids;
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The first sentence of a description, so that a caption stays short. */
export function shortCaption(text) {
  const m = text.match(/^(.{40,320}?[.!?])(\s|$)/);
  return m ? m[1] : text.slice(0, 320);
}

/** A figure with both of its variants; the stylesheet shows the one that matches the theme of the site. */
export function figureHtml(id, figure) {
  const alt = escapeHtml(figure.title);
  const picture = (theme) => `<a class="mr-fig__${theme}" href="/method-report/${id}-${theme}.svg" target="_blank" rel="noopener"><img src="/method-report/${id}-${theme}.svg" alt="${alt}" loading="lazy"></a>`;
  const caption = `<strong>${alt}.</strong> ${escapeHtml(shortCaption(figure.description))}`;
  return `<figure class="mr-fig">\n${picture('light')}\n${picture('dark')}\n<figcaption>${caption} <span class="mr-fig__file">docs/figures/${figure.dir}/${id}</span></figcaption>\n</figure>`;
}

/** Put each figure that the report names after the first paragraph that names it. Paragraphs inside a code fence are left alone. */
export function insertFigures(markdown, figures) {
  if (!figures.size) return markdown;
  const used = new Set();
  const out = [];
  let fence = false;
  for (const paragraph of markdown.split(/\n{2,}/)) {
    out.push(paragraph);
    const markers = (paragraph.match(/^\s*(```|~~~)/gm) ?? []).length;
    const inside = fence;
    if (markers % 2) fence = !fence;
    if (inside || markers) continue;
    for (const id of findFigureIds(paragraph, figures)) {
      if (used.has(id)) continue;
      used.add(id);
      out.push(figureHtml(id, figures.get(id)));
    }
  }
  return out.join('\n\n');
}

const countTables = (markdown) => (markdown.match(/^\|[ :\-|]+\|\s*$/gm) ?? []).length;
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
/** House style for counts in prose: words for one to nine, numerals with a thousands separator from ten. */
export const plural = (n, one, many = `${one}s`) => `${n < 10 ? NUMBER_WORDS[n] : n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** An ISO date in prose: "2026-11-05" becomes "5 November 2026". */
export const longDate = (iso) => {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : iso;
};

/**
 * The text of the post: its front matter and its body. Each section of the report becomes a `<details>` element whose summary holds the
 * heading, so that a reader can open one section at a time; the script of the page (src/scripts/method-report.js) adds the search, the
 * buttons, and the tools of the tables. Without the script every section still opens and closes.
 */
export function render(markdown, { revision = null, sourceLabel = 'METHOD_REPORT.md', figures = new Map() } = {}) {
  const report = parse(typographicMinus(absoluteLinks(insertFigures(markdown, figures))));
  const used = new Set();
  const sections = report.sections.map((s) => {
    const { number, title } = numbered(s.title);
    let id = number ? `sec-${number}` : slugify(title) || 'section';
    for (let n = 2; used.has(id); n += 1) id = `${number ? `sec-${number}` : slugify(title)}-${n}`;
    used.add(id);
    return { ...s, id, number, name: title, label: shortLabel(title), minutes: Math.max(1, Math.ceil(words(s.body) / WORDS_PER_MINUTE)) };
  });
  const totalWords = words(markdown);
  const summary =
    'This page is the method report of CYPMode, with sections that open and close, tables that can be filtered and sorted, and text that follows the repository.';
  const front = [
    '---',
    `title: ${yaml('CYPMode interactive method report')}`,
    `date: ${yaml(PUBLISHED)}`,
    `summary: ${yaml(summary)}`,
    'topic: method',
    'report: true',
    `sections: ${yaml(sections.map((s) => ({ id: s.id, label: s.number ? `${s.number} ${s.label}` : s.label })))}`,
    '---',
  ];
  const from = revision ? ` at revision <a href="${BLOB_URL.replace('/blob/main/', '')}/commit/${revision.sha}"><code>${revision.sha.slice(0, 7)}</code></a>, committed on ${longDate(revision.date)}` : '';
  const body = [
    `This is the interactive edition of the method report of CYPMode. The text is the report itself: this site reads [${sourceLabel}](${BLOB_URL}${sourceLabel}) from the repository whenever it is built, so a change to the report in the repository appears on this page without any further step. The sections open and close, the tables can be filtered and sorted, and the figures follow the light or dark theme of the site.`,
    '',
    `<p class="mr-source">Source: <a href="${BLOB_URL}${sourceLabel}">${sourceLabel}</a>${from}. ${plural(totalWords, 'word')}, ${plural(sections.length, 'section')}, ${figures.size ? `${plural(countTables(markdown), 'table')}, and ${plural(figures.size, 'figure')}` : `and ${plural(countTables(markdown), 'table')}`}. The report is released under CC BY-NC-SA 4.0.</p>`,
    '',
    '<div id="mr-toolbar" class="mr-toolbar"></div>',
    '',
    '<div class="mr">',
    '',
    report.intro ? `${report.intro}\n` : '',
    ...sections.flatMap((s, index) => [
      `<details class="mr-sec" id="${s.id}-section"${index === 0 ? ' open' : ''}>`,
      `<summary><span class="mr-num">${s.number || '·'}</span><h2 id="${s.id}">${s.name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</h2><span class="mr-meta">${s.minutes} min</span></summary>`,
      '',
      s.body,
      '',
      '</details>',
      '',
    ]),
    '</div>',
    '',
  ];
  return { text: `${front.join('\n')}\n\n${body.join('\n')}`, sections, words: totalWords, figures: figures.size };
}

async function fetchText(url, attempts = 2) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'mohamedtalaat-gif.github.io method-report sync' } });
      if (!response.ok) throw new Error(`${url} answered ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt >= attempts) throw error; // one more try for a timeout or a dropped connection
    }
  }
}

/** The latest commit that touched the report, for the line under the title. Failure only drops that line. */
async function latestRevision() {
  try {
    const headers = { 'user-agent': 'mohamedtalaat-gif.github.io method-report sync', accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/commits?path=METHOD_REPORT.md&per_page=1`, { signal: AbortSignal.timeout(10000), headers });
    if (!response.ok) return null;
    const [commit] = await response.json();
    return commit ? { sha: commit.sha, date: commit.commit.committer.date.slice(0, 10) } : null;
  } catch {
    return null;
  }
}

/** The figures that the report names, from the repository: both variants of each are saved in public/method-report. A figure that cannot be fetched is left out. */
async function loadFigures(markdown) {
  const available = new Map();
  try {
    const catalog = parseCatalog(await fetchText(`${RAW_URL}docs/figures/CATALOG.md`));
    const folder = path.join(ROOT, 'public/method-report');
    await mkdir(folder, { recursive: true });
    for (const id of findFigureIds(markdown, catalog)) {
      const figure = catalog.get(id);
      try {
        for (const theme of ['light', 'dark']) {
          const file = path.join(folder, `${id}-${theme}.svg`);
          let svg = null;
          try {
            svg = await fetchText(`${RAW_URL}docs/figures/${figure.dir}/${id}-${theme}.svg`);
          } catch (error) {
            if (!existsSync(file)) throw error; // the copy of an earlier build is used when the repository cannot be read
          }
          if (svg !== null) {
            if (!svg.includes('<svg') || /<script|\son\w+\s*=|javascript:/i.test(svg)) throw new Error('not a plain SVG');
            await writeFile(file, svg);
          }
        }
        available.set(id, figure);
      } catch (error) {
        console.warn(`method report: the figure ${id} is left out (${error.message})`);
      }
    }
  } catch (error) {
    console.warn(`method report: the figures are left out (${error.message})`);
  }
  return available;
}

async function main() {
  const written = existsSync(OUTPUT) ? (await stat(OUTPUT)).mtimeMs : 0;
  const scriptChanged = (await stat(fileURLToPath(import.meta.url))).mtimeMs > written; // a change to this script rewrites the post at once
  if (written && !scriptChanged && !process.env.FORCE && !process.env.METHOD_REPORT_SOURCE && Date.now() - written < FRESH_MS) {
    console.log('method report: the post was written a moment ago, kept');
    return;
  }
  const source = process.env.METHOD_REPORT_SOURCE ?? SOURCE_URL;
  const remote = /^https?:/.test(source);
  let markdown = null;
  let revision = null;
  try {
    const text = remote ? await fetchText(source) : await readFile(source, 'utf8');
    if (!looksLikeTheReport(text)) throw new Error('the file does not look like the method report');
    markdown = text;
    revision = source === SOURCE_URL ? await latestRevision() : null;
    await mkdir(path.dirname(SNAPSHOT), { recursive: true });
    await writeFile(SNAPSHOT, text);
    console.log(`method report: read ${source}`);
  } catch (error) {
    console.warn(`method report: ${source} could not be used (${error.message})`);
    if (existsSync(SNAPSHOT)) {
      markdown = await readFile(SNAPSHOT, 'utf8');
      console.warn('method report: the last good copy is used');
    }
  }
  if (!markdown) {
    console.warn('method report: no copy is available, the post is not written');
    return;
  }
  const { text, sections, words: total, figures } = render(markdown, { revision, figures: await loadFigures(markdown) });
  await writeFile(OUTPUT, text);
  console.log(`method report: wrote the post (${total} words, ${sections.length} sections, ${figures} figures)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
