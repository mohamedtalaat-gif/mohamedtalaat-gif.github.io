---
title: What the final OpenADMET boards say about CYPMode
date: "2026-11-05"
summary: Fourteenth of 62 on time-dependent inhibition, fifteenth of 38 on structure. What the released labels show about each entry, including where the entry did no better than the baseline.
topic: result
news: true
---

The final leaderboards of the OpenADMET CYP Inhibition Blind Challenge came out on 5 November. CYPMode placed 14th of 62 on time-dependent inhibition, with a macro MCC of 0.372 ± 0.038, and 15th of 38 on the CYP3A4 structure track, with an LDDT-PLI of 0.413 ± 0.030.

After the organisers released the labels and the 20 structures I scored my own entries against them, using a plan I had pushed before reading any of them. Four things stand out.

**The threshold was not the problem.** The organisers' scoring reproduces the board to the last digit, and the file I submitted is candidate A. Another threshold on the stored scores would have added at most 0.034 to the macro MCC. The gap between my entry and the first place is 0.126.

**The structure entry matches the baseline.** My submitted poses score 0.413 and the published Boltz-2 baseline scores 0.420. The difference is not shown to be real. Every rule I tried for choosing among predicted poses failed its gate, and the report says so.

**The pool held better poses than the choice did.** The best pose of each pool averages 0.526. What the recipe added was the iron–nitrogen restraint, a validity margin under the scorer's own checks, and a relaxation rule fixed before use, and not a better way to pick.

**The contact restraint was too generous.** It found all four coordinated ligands and called eight more coordinated that the released structures place beyond my 2.6 Å cut-off, at 2.75 to 4.93 Å from the iron, six of them within 3.1 Å, in maps of 3.0 to 3.6 Å resolution.

Of 187 ideas tested against gates written before their results, nine passed, and the 178 that did not are in the repository. I would rather publish that ledger than a cleaner story. The code, the method report, and the audit are archived at [10.5281/zenodo.23816450](https://doi.org/10.5281/zenodo.23816450).

**What the two scores measure.** The time-dependent inhibition track is scored by a macro Matthews correlation coefficient, which averages the coefficient over the endpoints so that no single one can carry the score. A value of 0 is chance and 1 is perfect agreement, so 0.372 is a modest but real signal. The structure track is scored by LDDT-PLI, which compares the distances between the ligand and nearby protein atoms in the predicted and released structures, so a pose that sits in the right place but with a wrong orientation loses points. Neither score is forgiving, and I find that clarifying.

**What my own checks showed before the boards.** Nested cross-validation on the scored population gave outer AUCs of 0.862 and 0.834 for CYP3A4 at the two label thresholds I tried, and 0.754 and 0.731 for CYP2D6. When I permuted the labels and repeated the whole procedure, the outer AUC fell to 0.510 and 0.501, as chance requires. The selection-aware CYP2D6 model raised the AUC on a set resembling the training panel from 0.562 to 0.728. The probabilities were calibrated inside the inner folds, to an expected calibration error of 0.019 for CYP3A4 and 0.005 for CYP2D6. These are reported with their sources on the Model validation page.

The final boards gave me the first independent test of all of this. The ranking is a position among entries and not a measure of how good the science is, but it is useful because it is outside my own judgement. I am glad that it agrees with the picture the audits had already drawn: a signal on time-dependent inhibition, and a structure entry that matches the baseline and no more.
