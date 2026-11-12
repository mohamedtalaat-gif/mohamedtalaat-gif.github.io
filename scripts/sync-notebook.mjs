// The interactive notebook: a blog post that wraps the web edition of the notebook of the CYPMode repository.
//
// The web edition (notebooks/web/index.html of the repository) is published by the Pages workflow of that repository at /CYPMode/notebook/, on the same origin as this site, so the post only
// frames it and passes the theme of the site to it. `npm run build` and `npm run dev` run this script first (the "prebuild" and "predev" entries of package.json). It reads the web edition from the
// main branch to count its parts, sections, figures, and words and to find the commit that last changed it, and it writes the post. The post is not committed.
//
//   NOTEBOOK_SOURCE=/path/to/CYPMode/notebooks/web npm run dev    read a local folder instead, and serve it at /CYPMode/notebook/ of the dev server (public/CYPMode/, not committed)
//
// If the repository cannot be read, the numbers of the last good run in src/data/notebook-facts.json are used. If there is neither, the post is not written, so the site never links to a page that is not there.

import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { longDate, plural, words } from './sync-method-report.mjs';

export const REPOSITORY = 'mohamedtalaat-gif/CYPMode';
export const WEB_URL = `https://raw.githubusercontent.com/${REPOSITORY}/main/notebooks/web/index.html`;
export const PAGE_PATH = '/CYPMode/notebook/';
export const BLOB_URL = `https://github.com/${REPOSITORY}/blob/main/`;
export const PUBLISHED = '2026-11-12';
export const WORDS_PER_MINUTE = 200;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FACTS = path.join(ROOT, 'src/data/notebook-facts.json');
const OUTPUT = path.join(ROOT, 'src/content/blog/cypmode-interactive-notebook.md');
const LOCAL_COPY = path.join(ROOT, 'public/CYPMode/notebook');

const yaml = (value) => JSON.stringify(value); // JSON is valid YAML, and escapes every character that YAML would need escaped

/** The page must look like the web edition before a post is written around it. */
export function looksLikeTheWebEdition(html) {
  return html.length > 1_000_000 && html.includes('id="main"') && html.includes('class="fig-dark"') && html.includes('id="tree"');
}

/** The visible text of the page: scripts, styles, and tags taken out, the entities of the page decoded. */
export function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<annotation[\s\S]*?<\/annotation>/g, ' ') // the TeX source that KaTeX keeps beside the typeset equation is not read twice
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/** What the page contains, counted from its markup: parts are the headings of level one after the title, sections those of level two. */
export function countFacts(html) {
  const count = (re) => (html.match(re) ?? []).length;
  const prose = html
    .replace(/<details class="src">[\s\S]*?<\/details>/g, ' ') // the code of the cells is not read as text
    .replace(/<section class="cell md toc">[\s\S]*?<\/section>/g, ' '); // the generated contents lists every heading again
  return {
    words: words(visibleText(prose)),
    parts: Math.max(0, (prose.match(/<h1[ >]/g) ?? []).length - 1),
    sections: (prose.match(/<h2[ >]/g) ?? []).length,
    figures: count(/<figure class="figure"/g),
    tables: (prose.match(/<table[ >]/g) ?? []).length,
  };
}

/** The post: front matter and body. The frame is filled in by the script of the page (src/scripts/embed.js) so that it opens in the theme of the site. */
export function render(facts, { revision = null, framePath = PAGE_PATH } = {}) {
  const minutes = Math.max(1, Math.ceil(facts.words / WORDS_PER_MINUTE));
  const summary =
    'This page is the notebook of CYPMode, with its biology, chemistry, mathematics, data, models, and code, read on a screen in the theme of this site, with a contents, a search of the whole text, and code that opens on request.';
  const from = revision ? ` at revision <a href="https://github.com/${REPOSITORY}/commit/${revision.sha}"><code>${revision.sha.slice(0, 7)}</code></a>, committed on ${longDate(revision.date)}` : '';
  const front = [
    '---',
    `title: ${yaml('CYPMode interactive notebook')}`,
    `date: ${yaml(PUBLISHED)}`,
    `summary: ${yaml(summary)}`,
    'topic: notebook',
    'embed: notebook',
    `minutes: ${minutes}`,
    '---',
  ];
  const counts = `${plural(facts.words, 'word')}, ${plural(facts.parts, 'part')}, ${plural(facts.sections, 'section')}, ${plural(facts.figures, 'figure')}, and ${plural(facts.tables, 'table')}`;
  const body = [
    'This is the interactive edition of the notebook of CYPMode. The notebook teaches the biology, chemistry, mathematics, data, and models of the project from first principles, and it runs every number of the project from its first cell to its last. The frame below is the web edition that the repository publishes. It follows the light or dark theme of this site, has a contents beside the text and a search of the whole notebook, and keeps code and long outputs closed until they are opened. A rebuild of the notebook in the repository reaches this page with the next build of the site, which runs on every push and every six hours.',
    '',
    `<p class="nb-source">Source: <a href="${BLOB_URL}notebooks/cypmode_notebook.ipynb">notebooks/cypmode_notebook.ipynb</a>${from}. ${counts}. The notebook is released under CC BY-NC-SA 4.0.</p>`,
    '',
    '<div class="nb-embed">',
    `<iframe class="nb-frame" data-theme-frame data-src="${framePath}" title="The notebook of CYPMode" loading="lazy"></iframe>`,
    `<noscript><p>The frame needs JavaScript. <a href="${PAGE_PATH}">Open the notebook in its own page</a>.</p></noscript>`,
    '</div>',
    '',
    `The notebook opens in [its own page](${PAGE_PATH}) as well, and the repository holds it as a [PDF](${BLOB_URL}notebooks/cypmode_notebook.pdf), a [Jupyter notebook](${BLOB_URL}notebooks/cypmode_notebook.ipynb), and [one HTML file](${PAGE_PATH}standalone/) with its figures embedded.`,
    '',
  ];
  return { text: `${front.join('\n')}\n\n${body.join('\n')}`, minutes };
}

async function latestRevision() {
  try {
    const headers = { 'user-agent': 'mohamedtalaat-gif.github.io notebook sync', accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/commits?path=notebooks/web/index.html&per_page=1`, { signal: AbortSignal.timeout(10000), headers });
    if (!response.ok) return null;
    const [commit] = await response.json();
    return commit ? { sha: commit.sha, date: commit.commit.committer.date.slice(0, 10) } : null;
  } catch {
    return null;
  }
}

async function fetchHtml(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000), headers: { 'user-agent': 'mohamedtalaat-gif.github.io notebook sync' } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.text();
}

async function main() {
  const local = process.env.NOTEBOOK_SOURCE;
  let facts = null;
  let revision = null;
  try {
    let html;
    if (local) {
      html = await readFile(path.join(local, 'index.html'), 'utf8');
    } else {
      html = await fetchHtml(WEB_URL);
      revision = await latestRevision();
    }
    if (!looksLikeTheWebEdition(html)) throw new Error('the file does not look like the web edition of the notebook');
    facts = countFacts(html);
    if (local) {
      await rm(LOCAL_COPY, { recursive: true, force: true });
      await mkdir(LOCAL_COPY, { recursive: true });
      await cp(path.join(local, 'index.html'), path.join(LOCAL_COPY, 'index.html'));
      if (existsSync(path.join(local, 'figures'))) await cp(path.join(local, 'figures'), path.join(LOCAL_COPY, 'figures'), { recursive: true });
      console.log(`notebook: the web edition in ${local} is served at ${PAGE_PATH} of the dev server`);
    } else {
      await mkdir(path.dirname(FACTS), { recursive: true });
      await writeFile(FACTS, `${JSON.stringify(facts, null, 2)}\n`);
      console.log(`notebook: read ${WEB_URL}`);
    }
  } catch (error) {
    console.warn(`notebook: the web edition could not be read (${error.message})`);
    if (existsSync(FACTS)) {
      facts = JSON.parse(await readFile(FACTS, 'utf8'));
      console.warn('notebook: the numbers of the last good run are used');
    }
  }
  if (!facts) {
    console.warn('notebook: no numbers are available, the post is not written');
    return;
  }
  const { text, minutes } = render(facts, { revision, framePath: local ? `${PAGE_PATH}index.html` : PAGE_PATH }); // the dev server does not serve the index of a folder of public/
  await writeFile(OUTPUT, text);
  console.log(`notebook: wrote the post (${facts.words} words, ${facts.parts} parts, ${facts.sections} sections, ${facts.figures} figures, ${minutes} min)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
