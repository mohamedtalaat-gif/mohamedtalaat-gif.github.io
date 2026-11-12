// A page of this site that frames a page of the project on the same origin (the notebook): the frame is opened in the theme of the site and follows it when it changes.
const theme = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

function start() {
  const frames = Array.from(document.querySelectorAll('iframe[data-theme-frame]'));
  frames.forEach((frame) => {
    const url = new URL(frame.dataset.src, location.href);
    url.searchParams.set('embed', '1');
    url.searchParams.set('theme', theme());
    frame.src = url.href;
  });
  new MutationObserver(() => {
    frames.forEach((frame) => {
      try {
        frame.contentWindow?.postMessage({ cypmodeTheme: theme() }, location.origin);
      } catch {
        // a frame that has not loaded yet takes the theme from its address
      }
    });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

start();
