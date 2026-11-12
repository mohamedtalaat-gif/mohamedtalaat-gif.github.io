// A page of this site that frames a page of the project on the same origin (the notebook, the explorer): the frame opens in the theme of the site and follows it when it changes.
//   the notebook is told the theme by a message, and takes it from its address when it opens;
//   an explorer (a marimo page) marks its theme by classes of its body, which are set here and set again if the page changes them.
const theme = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

function marimoTheme(doc, value) {
  const classes = doc.body.classList;
  if (classes.contains(`${value}-theme`) && !classes.contains(`${value === 'dark' ? 'light' : 'dark'}-theme`)) return;
  classes.remove('light', 'light-theme', 'dark', 'dark-theme');
  classes.add(value, `${value}-theme`);
  doc.documentElement.style.colorScheme = value;
}

function apply(frame) {
  let doc = null;
  try {
    doc = frame.contentDocument;
  } catch {
    return; // a page of another origin cannot be reached, and keeps its own theme
  }
  if (!doc || !doc.body) return;
  if (doc.getElementById('main') && doc.getElementById('tree')) {
    frame.contentWindow.postMessage({ cypmodeTheme: theme() }, location.origin);
  } else {
    marimoTheme(doc, theme());
  }
}

function start() {
  const frames = Array.from(document.querySelectorAll('iframe[data-theme-frame]'));
  frames.forEach((frame) => {
    frame.addEventListener('load', () => {
      apply(frame);
      try {
        const body = frame.contentDocument?.body;
        if (body && !frame.contentDocument.getElementById('main')) new MutationObserver(() => apply(frame)).observe(body, { attributes: true, attributeFilter: ['class'] });
      } catch {
        // the page of another origin is left alone
      }
    });
    const url = new URL(frame.dataset.src, location.href);
    url.searchParams.set('embed', '1');
    url.searchParams.set('theme', theme());
    frame.src = url.href;
  });
  new MutationObserver(() => frames.forEach(apply)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

start();
