import test from 'node:test';
import assert from 'node:assert/strict';
import { absoluteLinks, figureHtml, findFigureIds, insertFigures, longDate, looksLikeTheReport, numbered, parse, parseCatalog, plural, render, shortCaption, shortLabel, slugify, typographicMinus, words } from '../scripts/sync-method-report.mjs';
import { toNumber } from '../src/scripts/table-numbers.js';

const REPORT = `# Method report: a title

An opening paragraph.

## Summary and disclosures

The summary, with a [link to a file](docs/a.md) and an [outside link](https://example.org/x).

## 1. Scope and what is not claimed

Text of one.

\`\`\`
## not a heading, because it is inside a code fence
\`\`\`

### A subsection

| name | value |
| --- | --- |
| a | 0.5 |

## 2. Data (and the label rule): a long title that needs cutting for the catalogue

Text of two.
`;

test('a heading becomes an address of letters, digits, and single hyphens', () => {
  assert.equal(slugify('Summary and disclosures'), 'summary-and-disclosures');
  assert.equal(slugify('3. Architecture `of` the two tracks!'), '3-architecture-of-the-two-tracks');
});

test('the number of a section is taken out of its title', () => {
  assert.deepEqual(numbered('12. Negative results'), { number: '12', title: 'Negative results' });
  assert.deepEqual(numbered('Innovation summary'), { number: '', title: 'Innovation summary' });
});

test('the name in the catalogue stops at a colon or a bracket and is cut at a word near 30 characters', () => {
  assert.equal(shortLabel('Final TDI stack (chosen by the pre-registered gate rule)'), 'Final TDI stack');
  assert.equal(shortLabel('Scope'), 'Scope');
  const cut = shortLabel('Physics-, SAR-, committee-, embedding-, cross-isoform and weighting-based additions');
  assert.ok(cut.endsWith('…') && cut.length <= 31, cut);
});

test('the report is split at its headings and a fence hides the headings inside it', () => {
  const report = parse(REPORT);
  assert.equal(report.title, 'Method report: a title');
  assert.equal(report.intro, 'An opening paragraph.');
  assert.deepEqual(report.sections.map((s) => s.title), ['Summary and disclosures', '1. Scope and what is not claimed', '2. Data (and the label rule): a long title that needs cutting for the catalogue']);
  assert.ok(report.sections[1].body.includes('## not a heading'));
  assert.ok(report.sections[1].body.includes('### A subsection'));
});

test('a relative link points at the file on GitHub, and an outside link or an anchor is left alone', () => {
  const out = absoluteLinks('[a](docs/a.md) [b](./b.md) [c](https://example.org) [d](#top) ![i](img.png)');
  assert.ok(out.includes('[a](https://github.com/mohamedtalaat-gif/CYPMode/blob/main/docs/a.md)'));
  assert.ok(out.includes('[b](https://github.com/mohamedtalaat-gif/CYPMode/blob/main/b.md)'));
  assert.ok(out.includes('[c](https://example.org)') && out.includes('[d](#top)') && out.includes('![i](img.png)'));
});

test('the post has one details element for each section, with stable addresses and the catalogue in its front matter', () => {
  const { text, sections } = render(REPORT, { revision: { sha: 'abcdef1234567', date: '2026-11-11' } });
  assert.equal(sections.length, 3);
  assert.deepEqual(sections.map((s) => s.id), ['summary-and-disclosures', 'sec-1', 'sec-2']);
  assert.equal((text.match(/<details class="mr-sec"/g) ?? []).length, 3);
  assert.equal((text.match(/<\/details>/g) ?? []).length, 3);
  assert.equal((text.match(/<details class="mr-sec"[^>]* open>/g) ?? []).length, 1, 'only the summary is open when the page loads');
  assert.match(text, /^---\ntitle: "CYPMode interactive method report"/);
  assert.match(text, /topic: method\nreport: true\nsections: \[\{"id":"summary-and-disclosures","label":"Summary and disclosures"\}/);
  assert.match(text, /<h2 id="sec-1">Scope and what is not claimed<\/h2>/);
  assert.match(text, /commit\/abcdef1234567"><code>abcdef1<\/code><\/a>, committed on 11 November 2026/);
  assert.match(text, /one table\./);
  assert.ok(text.includes('https://github.com/mohamedtalaat-gif/CYPMode/blob/main/docs/a.md'));
});

test('two sections with the same title still get different addresses', () => {
  const { sections } = render('# Method report\n\n## Same\n\na\n\n## Same\n\nb\n');
  assert.equal(new Set(sections.map((s) => s.id)).size, 2);
});

test('a file that does not look like the report is refused', () => {
  assert.equal(looksLikeTheReport('404: Not Found'), false);
  assert.equal(looksLikeTheReport(`# Method report\n${'## S\n'.repeat(10)}${'x'.repeat(20000)}`), true);
});

test('words are counted without code fences or link addresses', () => {
  assert.equal(words('one two [three four](https://x.y/z)\n```\nfive six\n```\nseven'), 5);
});

test('a cell is a number when the whole cell is one, with a sign, thousands separators, or a percent sign', () => {
  assert.equal(toNumber('+0.0687'), 0.0687);
  assert.equal(toNumber('−0.02'), -0.02);
  assert.equal(toNumber('1,104'), 1104);
  assert.equal(toNumber('41%'), 41);
  assert.equal(toNumber('n/a'), null);
  assert.equal(toNumber('0.4 to 0.5'), null);
  assert.equal(toNumber(''), null);
});

test('counts in prose follow the house style: words for one to nine, numerals from ten', () => {
  assert.equal(plural(1, 'table'), 'one table');
  assert.equal(plural(9, 'section'), 'nine sections');
  assert.equal(plural(17, 'section'), '17 sections');
  assert.equal(plural(13008, 'word'), '13,008 words');
});

test('a date in prose is written out, and anything else is returned as it is', () => {
  assert.equal(longDate('2026-11-05'), '5 November 2026');
  assert.equal(longDate('2026-11-11T09:00:00Z'), '11 November 2026');
  assert.equal(longDate('soon'), 'soon');
});

test('a negative number gets the minus sign, but a range, a date, a code span, and a code fence keep the hyphen', () => {
  const out = typographicMinus('| a | -0.0069 | 2026-11-05 |\nThe mean rho -0.214, +0.042, (-0.071) and 5-fold in 2-3 years, and \`-0.5\`.\n\`\`\`\nx = -1\n\`\`\`');
  assert.ok(out.includes('| \u22120.0069 |') && out.includes('rho \u22120.214') && out.includes('(\u22120.071)'));
  assert.ok(out.includes('2026-11-05') && out.includes('5-fold') && out.includes('2-3 years') && out.includes('`-0.5`') && out.includes('x = -1'));
});

const CATALOG = parseCatalog('# Figure catalog\n\n## architecture\n\n### arch_a: The first pipeline\n\nThe first pipeline runs from the file to the calls. It has two steps.\n\n- files: arch_a-light.svg, arch_a-dark.svg\n\n## data\n\n### data_b: A rate <recovered> from "boards"\n\nA description that is long enough to be a caption of its own, and it ends here.\n\n- files: data_b-light.svg\n');

test('the catalogue gives the folder, the title, and the first paragraph of each figure', () => {
  assert.deepEqual([...CATALOG.keys()], ['arch_a', 'data_b']);
  assert.equal(CATALOG.get('arch_a').dir, 'architecture');
  assert.equal(CATALOG.get('data_b').dir, 'data');
  assert.equal(CATALOG.get('arch_a').description, 'The first pipeline runs from the file to the calls. It has two steps.');
});

test('a figure is found by its file name, with or without the folder, and by the words figure and its id', () => {
  assert.deepEqual(findFigureIds('Figures: `docs/figures/architecture/arch_a-light.png` and `data_b-light.png` (dark versions beside them).', CATALOG), ['arch_a', 'data_b']);
  assert.deepEqual(findFigureIds('see the figure `data_b` and `unknown-light.png` and the figure `nothing`', CATALOG), ['data_b']);
  assert.deepEqual(findFigureIds('no figure here', CATALOG), []);
});

test('a caption is the first sentence of the description, and the figure carries both variants and escapes its title', () => {
  assert.equal(shortCaption('The first pipeline runs from the file to the calls. It has two steps.'), 'The first pipeline runs from the file to the calls.');
  const html = figureHtml('data_b', CATALOG.get('data_b'));
  assert.ok(html.includes('class="mr-fig__light"') && html.includes('class="mr-fig__dark"') && html.includes('/method-report/data_b-light.svg') && html.includes('/method-report/data_b-dark.svg'));
  assert.ok(html.includes('A rate &lt;recovered&gt; from &quot;boards&quot;') && html.includes('docs/figures/data/data_b'));
});

test('each figure follows the first paragraph that names it, and a code fence is left alone', () => {
  const text = 'One paragraph names `arch_a-light.png`.\n\nAnother names it again: `arch_a-light.png`.\n\n```\nfigure `data_b`\n\nstill the fence `data_b-light.png`\n```\n\nAfter the fence, figure `data_b` is named.';
  const out = insertFigures(text, CATALOG);
  assert.equal((out.match(/<figure class="mr-fig">/g) ?? []).length, 2);
  assert.ok(out.indexOf('<figure') > out.indexOf('One paragraph') && out.indexOf('<figure') < out.indexOf('Another names it again'));
  assert.ok(out.lastIndexOf('<figure') > out.indexOf('After the fence'));
  assert.equal(insertFigures(text, new Map()), text);
});

test('the post counts its figures and carries them inside the section that names them', () => {
  const { text, figures } = render('# Method report\n\n## 1. One\n\nThe figure `arch_a-light.png` shows it.\n\n## 2. Two\n\nText.\n', { figures: new Map([['arch_a', CATALOG.get('arch_a')]]) });
  assert.equal(figures, 1);
  assert.match(text, /two sections, zero tables, and one figure\./);
});
