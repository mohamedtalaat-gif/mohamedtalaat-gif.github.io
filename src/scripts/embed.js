// A page of this site that frames a page of the project on the same origin (the notebook): the frame opens in the theme of the site and follows it when it changes. The notebook is told the theme by a
// message, and takes it from its address when it opens.
const theme = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

function apply(frame) {
  let doc = null;
  try {
    doc = frame.contentDocument;
  } catch {
    return; // a page of another origin cannot be reached, and keeps its own theme
  }
  if (!doc || !doc.body) return;
  if (doc.getElementById('main') && doc.getElementById('tree')) frame.contentWindow.postMessage({ cypmodeTheme: theme() }, location.origin);
}

function start() {
  const frames = Array.from(document.querySelectorAll('iframe[data-theme-frame]'));
  frames.forEach((frame) => {
    frame.addEventListener('load', () => apply(frame));
    const url = new URL(frame.dataset.src, location.href);
    url.searchParams.set('embed', '1');
    url.searchParams.set('theme', theme());
    frame.src = url.href;
  });
  new MutationObserver(() => frames.forEach(apply)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

start();
