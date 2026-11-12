// The number in a cell of a table, shared by the tools of the interactive method report and by its test.

const NUMBER = /^[\u2212+-]?\d[\d,]*(?:\.\d+)?(?:e[+-]?\d+)?%?$/i;

/** The number in a cell, or null when the cell is not a number: "+0.0687", "0.41%", "1,104", and "\u22120.02" count; "n/a" and "0.4 to 0.5" do not. */
export function toNumber(text) {
  const t = String(text).trim().replace(/\u2212/g, '-');
  return NUMBER.test(t) ? Number(t.replace(/[,%+]/g, '')) : null;
}
