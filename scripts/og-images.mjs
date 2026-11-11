// Link previews: a screenshot of every built page as it opens, 1200 x 630, so that a pasted link shows the page itself.
//
//   npm run build && node scripts/og-images.mjs [dist] [out]        (defaults: dist, public/og)
//
// The pages are served from the built folder and opened in Chrome in dark mode. Each picture is written to
// <out>/<path>.jpg ("/" becomes index.jpg). Pages that fail get the picture of the home page. Set CHROME_PATH to
// use another browser. The deploy workflow runs this after the build and then builds again, so that the
// previews always show the site as it is.
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFile, readdir, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname, relative, resolve } from 'node:path';

const DIST = resolve(process.argv[2] ?? 'dist');
const OUT = resolve(process.argv[3] ?? 'public/og');
const W = 1200, H = 630;

const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find((p) => p && existsSync(p));
if (!CHROME) { console.error('og-images: no Chrome found; set CHROME_PATH'); process.exit(1); }
if (!existsSync(join(DIST, 'index.html'))) { console.error(`og-images: ${DIST} has no index.html; run the build first`); process.exit(1); }

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.pdb': 'text/plain', '.txt': 'text/plain' };

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const pages = [];
for await (const f of walk(DIST)) {
  if (!f.endsWith('index.html')) continue;
  const rel = relative(DIST, dirname(f));
  pages.push(rel === '' ? '/' : `/${rel.split('\\').join('/')}/`);
}
pages.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b))); // the home page first: it is also the fallback

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = join(DIST, p);
    if (!file.startsWith(DIST)) throw new Error('outside');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}`;

const linux = process.platform === 'linux';
const launch = () => puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--hide-scrollbars', '--force-color-profile=srgb', '--ignore-gpu-blocklist', '--enable-webgl',
    ...(linux ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=metal']),
  ],
});
let browser = await launch();
let opened = 0;

const slugOf = (path) => path.replace(/^\/+|\/+$/g, '') || 'index';
const done = [], failed = [];
for (const path of pages) {
  const slug = slugOf(path);
  const file = join(OUT, `${slug}.jpg`);
  let page = null;
  try {
    // a browser that has drawn a few 3D scenes is restarted, and one that has died is replaced
    if (!browser.connected || opened >= 5) { await browser.close().catch(() => {}); browser = await launch(); opened = 0; }
    opened += 1;
    page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem('theme', 'dark'); } catch {} });
    await page.goto(base + path, { waitUntil: 'networkidle0', timeout: 40000 });
    await page.evaluate(() => document.fonts.ready);
    if (await page.$('canvas')) {
      // pages with a 3D scene: wait until it has been drawn (the home page prints the Fe-N distance when it has)
      if (await page.$('#readout-text')) await page.waitForFunction(() => (document.getElementById('readout-text')?.textContent ?? '').length > 0, { timeout: 20000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 3500));
      if (await page.$('#readout-text') && !(await page.$eval('#readout-text', (n) => n.textContent.trim()))) throw new Error('the 3D scene did not draw');
    } else {
      await new Promise((r) => setTimeout(r, 400));
    }
    await mkdir(dirname(file), { recursive: true });
    await page.screenshot({ path: file, type: 'jpeg', quality: 84, clip: { x: 0, y: 0, width: W, height: H } });
    done.push(path);
  } catch (e) {
    failed.push(`${path} (${String(e.message).slice(0, 80)})`);
  } finally {
    await page?.close().catch(() => {});
  }
}
await browser.close().catch(() => {});
server.close();

// a page that could not be drawn shows the home page, so that no link is left without a picture
const home = join(OUT, 'index.jpg');
if (existsSync(home)) {
  for (const path of failed.map((f) => f.split(' ')[0])) {
    const file = join(OUT, `${slugOf(path)}.jpg`);
    await mkdir(dirname(file), { recursive: true });
    await copyFile(home, file);
  }
}
console.log(`og-images: ${done.length} of ${pages.length} pages drawn into ${relative(process.cwd(), OUT) || '.'}`);
if (failed.length) console.log('og-images: failed, using the home page picture for:\n  ' + failed.join('\n  '));
if (!existsSync(home)) { console.error('og-images: the home page could not be drawn'); process.exit(1); }
