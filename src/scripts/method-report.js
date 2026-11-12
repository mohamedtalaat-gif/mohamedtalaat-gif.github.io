// The tools of the interactive method report (the post that scripts/sync-method-report.mjs writes). Plain browser code, no library.
// Every tool is an addition: the sections are `<details>` elements, the tables are Markdown tables, and both work without this script.

import { toNumber } from './table-numbers.js';

const root = document.querySelector('.mr');
if (root) start(root);

function start(root) {
  const sections = [...root.querySelectorAll('details.mr-sec')];
  const count = toolbar(root, sections);
  root.querySelectorAll('table').forEach(enhanceTable);
  addLinks(root);
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
  document.querySelectorAll('.toc a').forEach((a) => a.addEventListener('click', () => document.getElementById(a.dataset.toc)?.closest('details')?.setAttribute('open', '')));
  let wasOpen = [];
  window.addEventListener('beforeprint', () => {
    wasOpen = sections.map((s) => s.open);
    sections.forEach((s) => (s.open = true));
  });
  window.addEventListener('afterprint', () => sections.forEach((s, i) => (s.open = wasOpen[i] ?? s.open)));
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? '')) {
      e.preventDefault();
      document.querySelector('#mr-toolbar input')?.focus();
    }
  });
  return count;
}

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

/** The search box, the count of matches, and the two buttons that open or close every section. */
function toolbar(root, sections) {
  const slot = document.getElementById('mr-toolbar');
  if (!slot) return null;
  const input = el('input', { type: 'search', placeholder: 'Search the report ( / )', ariaLabel: 'Search the report', autocomplete: 'off', spellcheck: false });
  const status = el('span', { className: 'mr-count', role: 'status' });
  status.setAttribute('aria-live', 'polite');
  const open = el('button', { type: 'button', className: 'mr-btn', textContent: 'Expand all' });
  const close = el('button', { type: 'button', className: 'mr-btn', textContent: 'Collapse all' });
  open.addEventListener('click', () => sections.filter((s) => !s.hidden).forEach((s) => (s.open = true)));
  close.addEventListener('click', () => sections.forEach((s) => (s.open = false)));
  let timer = 0;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => search(root, sections, input.value, status), 160);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      search(root, sections, '', status);
    }
  });
  slot.append(el('label', { className: 'mr-search' }, input), status, open, close);
  return status;
}

function clearMarks(root) {
  root.querySelectorAll('mark.mr-hit').forEach((m) => {
    const parent = m.parentNode;
    m.replaceWith(document.createTextNode(m.textContent));
    parent.normalize();
  });
}

const LIMIT = 600; // marks per search, so that a one-letter query cannot freeze the page

/** Wrap each occurrence of the query inside a section in <mark>; returns how many were wrapped. */
function mark(section, query) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(escaped, 'gi');
  const present = new RegExp(escaped, 'i'); // a pattern without the g flag, because a global pattern remembers where its last test ended
  const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest('mark, script, style, button') || !present.test(n.nodeValue) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  let made = 0;
  for (const node of nodes) {
    if (made >= LIMIT) break;
    const fragment = document.createDocumentFragment();
    let last = 0;
    const text = node.nodeValue;
    pattern.lastIndex = 0;
    for (let m = pattern.exec(text); m && made < LIMIT; m = pattern.exec(text)) {
      fragment.append(text.slice(last, m.index), el('mark', { className: 'mr-hit', textContent: m[0] }));
      last = m.index + m[0].length;
      made += 1;
    }
    fragment.append(text.slice(last));
    node.replaceWith(fragment);
  }
  return made;
}

function search(root, sections, raw, status) {
  clearMarks(root);
  const query = raw.trim();
  if (query.length < 2) {
    sections.forEach((s) => (s.hidden = false));
    status.textContent = '';
    return;
  }
  const needle = query.toLowerCase();
  let hits = 0;
  let total = 0;
  for (const s of sections) {
    const found = s.textContent.toLowerCase().includes(needle);
    s.hidden = !found;
    if (found) {
      s.open = true;
      hits += 1;
      total += mark(s, query);
    }
  }
  status.textContent = hits ? `${total}${total >= LIMIT ? '+' : ''} matches in ${hits} of ${sections.length} sections` : 'No section contains this text';
}

/** A table that scrolls sideways, sorts by a column, filters its rows, and draws one numeric column as bars. */
function enhanceTable(table) {
  const body = table.tBodies[0];
  const head = table.tHead?.rows[0];
  if (!body || !head) return;
  const wrap = el('div', { className: 'mr-table' });
  table.replaceWith(wrap);
  const tools = el('div', { className: 'mr-table__tools' });
  wrap.append(tools, table);
  const rows = [...body.rows];
  rows.forEach((r, i) => (r.dataset.i = String(i)));
  const cells = (c) => rows.map((r) => r.cells[c]?.textContent ?? '');
  const numericColumns = [...head.cells].map((_, c) => {
    const values = cells(c).map(toNumber);
    return values.filter((v) => v !== null).length >= Math.max(3, 0.7 * rows.length);
  });

  if (rows.length > 8) {
    const filter = el('input', { type: 'search', placeholder: `Filter ${rows.length} rows`, ariaLabel: 'Filter the rows of this table', className: 'mr-table__filter' });
    const shown = el('span', { className: 'mr-count' });
    filter.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      let n = 0;
      rows.forEach((r) => {
        const keep = !q || r.textContent.toLowerCase().includes(q);
        r.hidden = !keep;
        n += keep ? 1 : 0;
      });
      shown.textContent = q ? `${n} of ${rows.length} rows` : '';
    });
    tools.append(filter, shown);
  }

  let sorted = { column: -1, direction: 0 };
  const bars = { column: -1 };
  const sortBy = (c) => {
    const direction = sorted.column === c ? (sorted.direction + 1) % 3 : 1; // ascending, descending, original order
    sorted = { column: c, direction };
    [...head.cells].forEach((th, i) => th.setAttribute('aria-sort', i === c && direction ? (direction === 1 ? 'ascending' : 'descending') : 'none'));
    const order = [...rows].sort((a, b) => {
      if (!direction) return Number(a.dataset.i) - Number(b.dataset.i);
      const x = a.cells[c]?.textContent ?? '';
      const y = b.cells[c]?.textContent ?? '';
      const nx = toNumber(x);
      const ny = toNumber(y);
      const result = nx !== null && ny !== null ? nx - ny : x.localeCompare(y, 'en', { numeric: true, sensitivity: 'base' });
      return direction === 1 ? result : -result;
    });
    body.append(...order);
  };
  [...head.cells].forEach((th, c) => {
    th.tabIndex = 0;
    th.setAttribute('role', 'button');
    th.setAttribute('aria-sort', 'none');
    th.title = 'Sort by this column';
    th.addEventListener('click', () => sortBy(c));
    th.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sortBy(c);
      }
    });
  });

  const choices = [...head.cells].map((th, c) => [c, th.textContent.trim()]).filter(([c]) => numericColumns[c]);
  if (choices.length) {
    const select = el('select', { className: 'mr-table__bars', ariaLabel: 'Draw a column as bars' });
    select.append(el('option', { value: '-1', textContent: 'Bars: none' }), ...choices.map(([c, name]) => el('option', { value: String(c), textContent: `Bars: ${name}` })));
    select.addEventListener('change', () => {
      bars.column = Number(select.value);
      rows.forEach((r) => [...r.cells].forEach((td) => (td.classList.remove('mr-bar'), td.style.removeProperty('--w'))));
      if (bars.column < 0) return;
      const values = cells(bars.column).map(toNumber);
      const real = values.filter((v) => v !== null);
      const lo = Math.min(0, ...real);
      const hi = Math.max(0, ...real);
      rows.forEach((r, i) => {
        if (values[i] === null || hi === lo) return;
        const td = r.cells[bars.column];
        td.classList.add('mr-bar');
        td.style.setProperty('--w', String(((values[i] - lo) / (hi - lo)) * 100));
      });
    });
    tools.append(select);
  }
  if (!tools.children.length) tools.remove();
}

/** A small button after each heading that copies the address of that heading. */
function addLinks(root) {
  root.querySelectorAll('h2[id], h3[id], h4[id]').forEach((h) => {
    const button = el('button', { type: 'button', className: 'mr-link', textContent: '#', title: 'Copy the link to this heading' });
    button.setAttribute('aria-label', `Copy the link to ${h.textContent}`);
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = `${location.origin}${location.pathname}#${h.id}`;
      history.replaceState(null, '', `#${h.id}`);
      try {
        await navigator.clipboard.writeText(url);
        button.textContent = 'Copied';
        setTimeout(() => (button.textContent = '#'), 1400);
      } catch {
        button.textContent = '#';
      }
    });
    h.append(button);
  });
}

/** Open the sections that contain the heading named in the address, then scroll to it. */
function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  for (let d = target.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;
  requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}
