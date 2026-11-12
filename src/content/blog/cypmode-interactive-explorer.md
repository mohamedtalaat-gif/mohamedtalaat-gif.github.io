---
title: "CYPMode interactive explorer"
date: "2026-11-12"
summary: "The explorer of CYPMode runs in the browser, without a server: the ledger of gates, what a different rule would have let through, the selection rules fold by fold, the poses of the benchmark, and the out-of-fold predictions of every candidate."
topic: explorer
embed: explorer
minutes: 0
---

This is the interactive explorer of CYPMode. The notebook teaches each step of the project from first principles; the explorer lets a reader change the inputs of a step and see what the stored results say. The frame below is the explorer that the repository publishes. It runs in the browser without a server, follows the light or dark theme of this site, and reads only the small public tables of the repository, so nothing in it is fitted again and nothing leaves the page.

<div class="nb-embed">
<iframe class="nb-frame" data-theme-frame data-src="/CYPMode/explorer/" title="The explorer of CYPMode" loading="lazy"></iframe>
<noscript><p>The frame needs JavaScript. <a href="/CYPMode/explorer/">Open the explorer in its own page</a>.</p></noscript>
</div>

The explorer opens in [its own page](/CYPMode/explorer/) as well. The pages of the explorer are rebuilt from the repository whenever it changes, so this page always shows the current one. The complete explorer, with a simulator for every section of the notebook, needs the chemistry libraries of the project (RDKit and the extended tight-binding program xTB), which have no build for the browser; it runs on a computer with the launcher in the [repository](https://github.com/mohamedtalaat-gif/CYPMode/tree/main/explorer/full).
