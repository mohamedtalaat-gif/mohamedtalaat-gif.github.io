import assert from 'node:assert/strict';
import test from 'node:test';
import { countFacts, looksLikeTheWebEdition, render, visibleText } from '../scripts/sync-notebook.mjs';

const page = (body) => `<!doctype html><html><head><style>.a{color:red}</style><script>var x = "not text";</script></head><body><div id="tree"></div><main id="main">${body}</main></body></html>`;

test('the web edition is told from another page by its markup and its size', () => {
  const real = page(`<img class="fig-dark" src="figures/a-dark.png">${'<p>text</p>'.repeat(120_000)}`);
  assert.equal(looksLikeTheWebEdition(real), true);
  assert.equal(looksLikeTheWebEdition(page('<p>short</p>')), false);
  assert.equal(looksLikeTheWebEdition('<html>'.repeat(300_000)), false);
});

test('the numbers of the page are counted from its markup, without the code, the contents, and the scripts', () => {
  const html = page(
    [
      '<section class="cell md titlepage"><h1 id="cypmode">CYPMode</h1></section>',
      '<section class="cell md toc"><h2 id="toc">Table of contents</h2><p>one two three</p></section>',
      '<section class="cell md"><h1 id="p1">Part I. One</h1><h2 id="s1">1.1 First</h2><p>Four words are here.</p></section>',
      '<div class="cell code"><details class="src"><summary>code</summary><pre>print("many many many words")</pre></details></div>',
      '<figure class="figure" id="fig-a"><img class="fig-dark" src="figures/a-dark.png"></figure>',
      '<table><tr><td>cell</td></tr></table>',
    ].join(''),
  );
  const facts = countFacts(html);
  assert.equal(facts.parts, 1); // the title of the first page is not a part
  assert.equal(facts.sections, 1); // the contents lists every heading again and is left out
  assert.equal(facts.figures, 1);
  assert.equal(facts.tables, 1);
  assert.ok(facts.words >= 7 && facts.words < 14, `${facts.words} words`);
  assert.ok(!visibleText(html).includes('not text') && !visibleText(html).includes('color:red'));
});

test('the post frames the page in the theme of the site, states its reading time, and names the revision', () => {
  const { text, minutes } = render({ words: 221355, parts: 18, sections: 143, figures: 102, tables: 286 }, { revision: { sha: 'abcdef1234567', date: '2026-11-12' } });
  assert.equal(minutes, 1107);
  assert.match(text, /^minutes: 1107$/m);
  assert.match(text, /^embed: notebook$/m);
  assert.match(text, /<iframe class="nb-frame" data-theme-frame data-src="\/CYPMode\/notebook\/"/);
  assert.match(text, /at revision <a href="https:\/\/github\.com\/mohamedtalaat-gif\/CYPMode\/commit\/abcdef1234567"><code>abcdef1<\/code><\/a>, committed on 12 November 2026/);
  assert.match(text, /221,355 words, 18 parts, 143 sections, 102 figures, and 286 tables/);
  assert.doesNotMatch(text, /—/); // no em dash in the text of the site
});
