---
title: A surfactant dry lab rebuilt from a personal-care seminar
date: "2026-10"
summary: Forty charts as data, thirty-four formulas with calculators, twenty-seven structures in 3D, and coarse-grained molecular dynamics of micelle and bilayer assembly, built in marimo.
topic: release
news: true
---

In October 2026 I released the Stepan Surfactant Cheminformatics notebook, an independent educational dry lab built from a personal-care seminar. It reconstructs the seminar's material as data, calculators, structures and simulations that a reader can run. The code is under the MIT licence. The seminar decks themselves belong to Stepan and are not redistributed.

Surfactants are the working molecules of personal care. A surfactant has a water-loving head and an oil-loving tail, and in water the molecules gather into micelles, bilayers or other structures that clean, emulsify and condition. The seminar covered the surfactants and conditioning actives that formulators use and the way their properties set a product's behaviour. I wanted to make that material interactive, so that a reader can change a number and see what follows.

The notebook has three parts. The first reconstructs 40 charts from the seminar as data, so the curves can be plotted, inspected and compared and not just looked at. The second collects 34 formulas, each with a calculator, covering the arithmetic that formulators do routinely. The third presents 27 surfactant structures in three dimensions, rendered from RDKit, so that the relation between a head group, a tail length and a property can be seen.

The part I found most rewarding is the simulation. Using OpenMM, I built coarse-grained models in which each surfactant is a short chain of beads, and ran molecular dynamics of three systems: sodium lauryl sulfate, a mixture of alpha-olefin sulfonates with cocobetaine, and an ester quat with cetyl alcohol. Starting from molecules placed on a lattice in water at 310 K, the runs show aggregation proceeding over tens of nanoseconds, and give the aggregate size, radius of gyration and a radial profile of tails, heads and ions. The Visualization page replays these trajectories in the browser, and each is a single random seed, which the page states.

Coarse graining makes a useful trade. An all-atom simulation of a surfactant mixture in water large enough to show micelle formation would be expensive. A bead model captures the essential physics, the hydrophobic effect and the head-group repulsion, at a cost that allows a notebook to run it. The model shows qualitative behaviour, and I do not claim quantitative predictions of properties such as critical micelle concentration from it.

The notebook is built in marimo, a reactive notebook environment where changing a value updates everything that depends on it, which suits a calculator-style document better than a script. It also helps reproducibility, because the notebook is a plain Python file that can be checked into version control.

The motivation is the same as in my other releases. Formulators often decide by experience, and I want to see how far calculation and simulation can inform the decision before a batch is made. The notebook is my starting point for that question in surfactant systems.
