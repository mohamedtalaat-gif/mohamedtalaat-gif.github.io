---
title: CEREBRO-X, a pipeline for ranking CNS delivery systems
date: "2026-09"
summary: An open research prototype that scores delivery systems for central nervous system drugs on a 62-criterion rubric, released with a public audit of its own bugs.
topic: release
---

In September 2026 I released CEREBRO-X, an open-source pipeline that ranks delivery systems for drugs that have to act in the central nervous system. It is a research prototype under the MIT licence, and it ships with a public audit of its own bugs and limits.

The problem is a familiar one in my reading of the literature. A drug aimed at the brain has to cross the blood–brain barrier, and the carrier that delivers it affects how much gets across, how long it circulates, and how stable it is. There are many carriers to choose from, including liposomes, polymeric and lipid nanoparticles, antibody conjugates, and oligonucleotide formulations, and a formulator has to decide among them with limited data. CEREBRO-X turns that decision into a structured comparison. A rubric of 62 criteria scores each candidate system for a given drug, and the criteria draw on three kinds of calculation: a physiologically based pharmacokinetic model of exposure, DLVO theory for the colloidal stability of the carrier, and a QSAR model trained on ChEMBL data.

The choice of these three is deliberate. Pharmacokinetic modelling asks whether the drug reaches the target in the body at a useful level. DLVO analysis asks whether the carrier particles stay dispersed or aggregate, which depends on the balance of electrostatic repulsion and van der Waals attraction. A QSAR model asks what the chemistry of the drug implies about activity and properties. Each of them has known weak points, and the rubric keeps them separate so that a reader can see which one drives a ranking. I ran the pipeline on six drugs across three classes (small molecules, antibodies, and oligonucleotides) to see whether the scoring behaved sensibly across very different cargo.

One component predicts blood–brain barrier permeability from the public BBBP benchmark, using a fingerprint network and a graph network. This part carries the most important lesson of the release. On a random split of the data, these models score a ROC-AUC of about 0.95 to 0.97. On a scaffold split, where every ring system in the test set is absent from training, the scores fall to about 0.60 for the fingerprint network and 0.69 for the graph network, on 204 held-out compounds. The earlier README quoted the random-split figure, which overstated how well the model handles new chemistry, and I replaced it with the scaffold figure and its interval. The Model validation page has a report on this comparison.

I released CEREBRO-X as a prototype, not as a tool for decisions, and I tried to make that visible. The repository contains an audit trail of bugs found in earlier versions and the validation limits of each component. I think that publishing the failures is the more useful thing for a reader than presenting a polished score, because it shows which outputs deserve trust. The same view runs through CYPMode and through the validation reports.

The pipeline connects to my other interests. It is the computational counterpart to the review of nano-antioxidants that I led in 2025, which found that comparative designs and nanoplatforms are underrepresented and called for rigorous validation of how these carriers behave. CEREBRO-X is one attempt to apply a consistent set of criteria across carriers and to be honest about its own accuracy.
