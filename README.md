# IC50's Lab

Personal research site of Muhammad Talaat: drug design, delivery and formulation, with open code, public validation and a ledger of failures.

Live address: https://mohamedtalaat-gif.github.io/

## Run it

```bash
npm install
npm run dev      # http://127.0.0.1:4321
npm run build    # static site in dist/
```

## Layout

- `src/pages` holds the pages; `src/data/site.ts` holds the lists (specialty line, location, links, news and activities, repositories, education, work, client brands) and `src/data/reports.ts` holds the validation reports.
- `src/lib/news.js` builds the News feed (`src/lib/feed.ts` feeds it): every post, every activity, course and conference that no post already tells (same kind, same day, shared words), and the validation reports, one line for each day. A new entry in any of them appears on the News page and the home page without any other edit; `npm test` covers the rules.
- `src/content/blog/*.md` holds the blog posts (front matter: `title`, `date`, `summary`, optional `draft: true`, and `news: false` to leave it out of the News page and the home page). Reading time is computed from the text by `src/lib/reading.ts` (200 words a minute), so a new post needs nothing else.
- `scripts/sync-method-report.mjs` writes the post `cypmode-interactive-method-report` from `METHOD_REPORT.md` on the main branch of the [CYPMode](https://github.com/mohamedtalaat-gif/CYPMode) repository. `npm run dev` and `npm run build` run it first, so an edit to the report in that repository reaches the site with the next deploy (every push here and every six hours). Each section of the report becomes a collapsible section, and the page adds the catalogue on the right, buttons that open or close every section, and filter, sort, and bar tools for the tables (`src/scripts/method-report.js`, `src/styles/report.css`, `src/components/ReportTools.astro`). The figures that the report names (`docs/figures/CATALOG.md` of the repository lists them) are fetched at build into `public/method-report/`, which git ignores, and each is placed after the paragraph that names it in a light and a dark variant, of which the theme of the site shows one. The post is not committed. If the repository cannot be read, the last good copy in `src/data/method-report.snapshot.md` is used, and a file that does not look like the report is refused. `METHOD_REPORT_SOURCE=/path/to/METHOD_REPORT.md npm run dev` reads a local file instead, and `npm test` covers the transformation.
- `src/scripts/cyp-scene.ts` draws the CYP3A4 active site with 3Dmol.js (home page and the Fe–N experiment). `src/scripts/gh-spectrum.js` is a copy of the standalone [gh-spectrum](https://github.com/mohamedtalaat-gif/gh-spectrum) activity card.
- `scripts/og-images.mjs` draws the link preview of every page: a screenshot of the built page as it opens, 1200 by 630. The deploy workflow runs it after the build and builds again, so a pasted link always shows the site as it is. `public/og/index.jpg` is the fallback for a page without its own picture; to renew it, run `npm run build && npm run og` and keep `public/og/index.jpg`.
- `src/components` holds the shared parts: side-heading sections, the right-hand catalogue, icon links and the report charts.
- `public/data` holds chain A of RCSB PDB entries 2V0M and 3NXU (trimmed to the protein, heme and the iron-coordinating ligand), the twenty pose files of the pose viewer (`poses/`, built by `scripts/make_poses.py`) and the three coarse-grained trajectories of the assembly player (`md/`). `scripts/add_ss.py` writes secondary-structure records into the PDB files.

## Data and licences

Structures come from the RCSB Protein Data Bank. The released CYP3A4 structures in the pose viewer come from the OpenADMET challenge organisers and keep their own terms; the submitted poses and metrics are outputs of CYPMode. Rendering uses 3Dmol.js (BSD-3-Clause). Brand icons for GitHub, ORCID and Google Scholar come from Simple Icons (CC0); the LinkedIn, envelope and location-pin icons are from Font Awesome Free (CC BY 4.0). The path data is in `src/data/icons.ts`. Fonts are Barlow Semi Condensed and Source Serif 4, both under the SIL Open Font License, bundled through Fontsource. Text and figures are the author's. The site code is released under the MIT licence.
