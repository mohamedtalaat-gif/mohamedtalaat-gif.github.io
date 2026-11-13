---
title: "The CYPMode film: nine jobs, one person, every number real"
date: "2026-11-13"
summary: A film of six and a half minutes explains CYPMode from the question to the results. Each job in the project has a character, and a short list of rules keeps the fun away from the science.
topic: film
---

<a href="https://mohamedtalaat-gif.github.io/CYPMode/film/"><img src="/img/cypmode-film-poster.jpg" alt="The poster of the CYPMode film: the title, the question 'Will I switch off a liver enzyme, and keep it off?', four numbers, and the nine characters with Cap, a smiling capsule, in front." width="1200" height="675" loading="lazy" style="max-width:100%;height:auto;border-radius:6px"></a>

The method report of CYPMode runs to more than 13,000 words, because I wrote it for a reader who wants to check every number. Most readers will not begin there, so I made [a film](https://mohamedtalaat-gif.github.io/CYPMode/film/) that goes from the question to the results in six and a half minutes, with subtitles and a voice for every scene.

## One person, nine jobs

I did every job in this project myself, so I gave each job a face. The nine staff of the film are characters, not colleagues. The passenger is Cap, a smiling capsule that stands for a real compound of the OpenADMET CYP Inhibition Blind Challenge. The film carries Cap from station to station until the results come out.

- Kai, the assay analyst, turns two measurements per compound into a label.
- Scout, the data scout, compares the files that the organisers released with the blinded test set by name, and never reads the measurement of a test compound.
- Bits, the chemoinformatician, turns a molecule into numbers.
- Stacker, the modeller, blends a committee of 23 models into one score.
- Gatekeeper, the statistician, runs the nested validation and keeps the gates that were written before the results.
- Quanta, the quantum chemist, computes the physics columns.
- Foundry, the engineer of pretrained models, adds each model to the stack and judges it by the same rule.
- Dock, the structural biologist, folds the molecule into the enzyme and checks the pose.
- Auditor, the reproducibility officer, runs everything twice.

## How a heavy idea becomes light

- A passenger replaces the diagram. A fingerprint, a dose–response curve, and a receiver operating characteristic (ROC) curve are abstract until one compound goes through all of them. Cap turns the pipeline into a journey.
- Each scene asks one question. Each character introduces himself in one line, and then does his job on real data. The film itself opens with the question the project answers: will a compound switch off a liver enzyme, and keep it off?
- Every term gets a plain sentence under it. One subtitle reads “A fingerprint records which small groups of atoms the molecule contains.” Another reads “Only names are compared: the measurement of a test compound is never read.”
- Real coordinates sit behind the glamour. The slow approach to the heme pocket is drawn from the crystal structure 6MA7, and the callouts follow the iron and the coordinating nitrogen frame by frame.

## What the fun may not touch

1. Every number on screen is read from the project’s own files when the film is rendered. If a file changes, the film changes.
2. Every molecule and every pocket is drawn from coordinates.
3. Failures get the same screen time as successes. The ledger of every idea and its verdict is on screen, and the physics columns and most of the pretrained models end in a NOT MET stamp.
4. The film audits itself in front of the viewer. Two runs of the audit sit side by side and end in an IDENTICAL stamp.
5. A test draws the film every two seconds and fails if a text leaves its box or the frame.
6. The characters are synthetic illustrations and the voices are synthesised. None of them is a real person, and the film makes no claim to be studio work. The storyboard describes how it was built.

## What the numbers in the last scene are

The last scene and the poster show estimates from nested cross-validation on the training data: an area under the curve (AUC) of 0.834 for CYP3A4 and 0.731 for CYP2D6, 187 ideas judged, and 20 poses with no failed PoseBusters check. No released test label is involved. They are not the result on the board, and PoseBusters checks whether a pose is physically valid, not whether it is right. The result on the board, and what the released labels show, are in [the post on the final boards](/blog/openadmet-final-boards/).

## Where to look

The film is on [the pages of the project](https://mohamedtalaat-gif.github.io/CYPMode/film/), and the [storyboard](https://github.com/mohamedtalaat-gif/CYPMode/blob/main/docs/video/STORYBOARD.md) lists every scene, every source of a number, and the build. The code, the audit, and the method are archived at [10.5281/zenodo.23816450](https://doi.org/10.5281/zenodo.23816450), and the [interactive method report](/blog/cypmode-interactive-method-report/) holds the whole argument. The film is under CC BY-NC-SA 4.0, like the other documents of the project. The challenge is by OpenADMET, and the measurements were made at Octant.

If a scene is unclear, tell me which one, and I will fix the film or the report.
