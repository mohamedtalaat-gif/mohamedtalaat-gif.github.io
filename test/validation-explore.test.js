import assert from 'node:assert/strict';
import test from 'node:test';
import { chartSvg, chartTable, niceTicks } from '../src/lib/charts.js';
import { chartOf, csvOf, exploreFromChart, fill, initialValues, rowsOf, summaryOf, tableHtml } from '../src/lib/explore.js';

const explore = {
  noun: 'bins',
  mean: { key: 'rho', label: 'rank correlation' },
  columns: [{ key: 'enzyme', label: 'Enzyme' }, { key: 'bin', label: 'Bin' }, { key: 'auc', label: 'AUC', digits: 3 }, { key: 'lo', label: 'Low', digits: 3 }, { key: 'hi', label: 'High', digits: 3 }, { key: 'rho', label: 'Rho', digits: 3 }],
  rows: [
    { enzyme: 'CYP3A4', bin: 'below 0.3', auc: 0.783, lo: 0.709, hi: 0.847, rho: -0.2 },
    { enzyme: 'CYP3A4', bin: '0.3 to 0.4', auc: 0.813, lo: 0.777, hi: 0.846, rho: 0.1 },
    { enzyme: 'CYP2D6', bin: '0.6 to 0.7', auc: null, lo: null, hi: null, rho: 0.3 },
    { enzyme: 'CYP2D6', bin: 'below 0.3', auc: 0.527, lo: 0.474, hi: 0.591, rho: -0.1 },
  ],
  controls: [
    { id: 'enzyme', type: 'filter', key: 'enzyme', label: 'Enzyme', options: [{ value: '*', label: 'Both' }, { value: 'CYP3A4', label: 'CYP3A4' }, { value: 'CYP2D6', label: 'CYP2D6' }], value: 'CYP3A4' },
    { id: 'sort', type: 'sort', label: 'Order', options: [{ value: 'order', label: 'By bin' }, { value: '-auc', label: 'Highest first' }] },
  ],
  charts: [{ type: 'intervals', label: '{enzyme}, {bin}', est: 'auc', lo: 'lo', hi: 'hi', ref: 0.6, min: 0.4, max: 1, refLabel: 'bar', tip: '{enzyme} {bin}: AUC {auc:3}' }],
};

test('axis ticks fall on round values with the decimals that the step needs', () => {
  assert.deepEqual(niceTicks(0.5, 1), { ticks: [0.5, 0.6, 0.7, 0.8, 0.9, 1], decimals: 1 });
  assert.deepEqual(niceTicks(0, 800).ticks, [0, 200, 400, 600, 800]);
  assert.deepEqual(niceTicks(0, 0.6).ticks, [0, 0.2, 0.4, 0.6]);
});

test('a chart carries the tooltip of each mark and a bin without an estimate says so', () => {
  const svg = chartSvg(chartOf(explore, { enzyme: '*', sort: 'order' }, rowsOf(explore, { enzyme: '*', sort: 'order' })), 'AUC by bin');
  assert.match(svg, /^<svg viewBox="0 0 640 \d+" role="img" aria-label="AUC by bin"/);
  assert.equal((svg.match(/data-tip="/g) ?? []).length, 4);
  assert.match(svg, /data-tip="CYP3A4 below 0\.3: AUC 0\.783"/);
  assert.match(svg, /no AUC \(too few held-out compounds\)/);
  assert.throws(() => chartSvg({ type: 'pie' }), /unknown chart type/);
});

test('controls filter and sort the rows, and a report starts with the first option of each control', () => {
  assert.deepEqual(initialValues(explore), { enzyme: 'CYP3A4', sort: 'order' });
  assert.equal(rowsOf(explore, { enzyme: 'CYP3A4', sort: 'order' }).length, 2);
  assert.equal(rowsOf(explore, { enzyme: '*', sort: 'order' }).length, 4);
  const sorted = rowsOf(explore, { enzyme: '*', sort: '-auc' });
  assert.deepEqual(sorted.map((r) => r.auc), [0.813, 0.783, 0.527, null]); // a missing value goes last
  assert.equal(summaryOf(explore, sorted), '4 of 4 bins; mean rank correlation 0.025');
});

test('a template fills its placeholders and writes n/a for a missing value', () => {
  assert.equal(fill('{enzyme}: {auc:2}', explore.rows[2]), 'CYP2D6: n/a');
  assert.equal(fill('{auc:2}', explore.rows[0]), '0.78');
});

test('the table and the CSV carry the rows that remain, with quotes escaped and the true minus in the table', () => {
  const rows = rowsOf(explore, { enzyme: '*', sort: 'order' });
  const html = tableHtml(explore, rows);
  assert.match(html, /<th scope="col" data-key="auc" data-kind="number"/);
  assert.match(html, /<td data-v="-0.2" class="num">−0\.200<\/td>/);
  const csv = csvOf({ columns: [{ key: 'a', label: 'A, one' }, { key: 'b', label: 'B' }] }, [{ a: 'x "y"', b: null }]);
  assert.equal(csv, '"A, one",B\n"x ""y""",\n');
});

test('a report without a table of its own gets the values of its chart as one', () => {
  const chart = { type: 'pairs', min: 0, max: 1, aLabel: 'before', bLabel: 'after', items: [{ label: 'x', a: 0.5, b: 0.75 }] };
  const generic = exploreFromChart(chart, chartTable);
  assert.deepEqual(generic.columns.map((c) => c.label), ['Item', 'before', 'after']);
  assert.deepEqual(generic.rows, [{ c0: 'x', c1: 0.5, c2: 0.75 }]);
  assert.equal(generic.controls.length, 0);
});

test('bars can be grouped by a column, with the largest value of each group', () => {
  const grouped = { charts: [{ type: 'bars', groupBy: 'ligand', agg: 'max', label: '{key}', value: 'moved', max: 1, tip: '{key}: {value} over {n}' }], rows: [], controls: [] };
  const rows = [{ ligand: 'A', moved: 0.2 }, { ligand: 'A', moved: 0.5 }, { ligand: 'B', moved: 0.3 }];
  const chart = chartOf(grouped, {}, rows);
  assert.deepEqual(chart.items.map((i) => [i.label, i.value, i.tip]), [['A', 0.5, 'A: 0.5 over 2'], ['B', 0.3, 'B: 0.3 over 1']]);
});
