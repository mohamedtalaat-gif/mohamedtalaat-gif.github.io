// The filters of the list of validation reports on the page of the collection: a search of the title and the summary, and one selection for the study, the endpoint, the method, and the dataset.
// Without this script the whole list is shown.
const root = document.querySelector('[data-vfilter]');
if (root) {
  const rows = Array.from(document.querySelectorAll('li[data-report]'));
  const count = document.querySelector('[data-vcount]');
  const search = root.querySelector('[data-vsearch]');
  const selects = Array.from(root.querySelectorAll('select[data-vfilter-key]'));
  const listOf = (row, key) => {
    const raw = row.dataset[key];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return [raw];
    }
  };
  const update = () => {
    const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const row of rows) {
      const ok = words.every((w) => row.dataset.text.includes(w)) && selects.every((s) => !s.value || listOf(row, s.dataset.vfilterKey).includes(s.value));
      row.hidden = !ok;
      if (ok) shown += 1;
    }
    count.textContent = `${shown} of ${rows.length} reports`;
  };
  search.addEventListener('input', update);
  selects.forEach((s) => s.addEventListener('change', update));
}
