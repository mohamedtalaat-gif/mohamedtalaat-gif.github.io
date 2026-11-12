---
title: Lung-targeted rifampicin microparticles
date: "2020"
summary: Particle engineering for pulmonary delivery of rifampicin, with LIMS-based sample governance and serial-trial regulatory documentation.
topic: project
---

In 2020 I worked on a formulation project aimed at delivering rifampicin to the lungs for pulmonary tuberculosis. My part was formulation engineering: designing and characterising the microparticles, organising the samples, and keeping the regulatory documentation for a series of trials. I was not involved in the *in vivo* trials.

The case for pulmonary delivery is simple. Tuberculosis in the lung is treated with drugs given by mouth, and the drug has to travel through the gut, the liver, and the blood before a fraction of it reaches the infected tissue. A powder inhaled into the lung puts the drug at the site directly, which in principle allows a higher local concentration for a lower systemic dose. Rifampicin is a good candidate because it is potent against the organism, but its use is limited by systemic exposure, so a route that favours the lung is attractive.

Making that idea work is a particle engineering problem. For a dry powder to reach the deep lung, the particles need an aerodynamic size of a few micrometres: larger particles deposit in the throat, smaller ones can be exhaled. The particles must also flow and disperse well from an inhaler, and they must dissolve at a useful rate once they land in the thin lining fluid of the lung. Each of those properties depends on how the particles are made, so the design space is wide. The experiments I worked on varied particle size, pH, polymorphism, and solubility, because each affects whether a particle deposits, dissolves, and stays stable.

Polymorphism deserves a word, because it is easy to underestimate. A crystalline drug can exist in several solid forms with different solubility and stability. Spray-drying and other particle-forming processes can produce a different form from the starting material, or an amorphous one, and the form can change on storage. Solubility measured on one form says little about another, so every batch needed characterisation, and conclusions needed to be tied to the form actually present.

The other half of my role was organisation. A particle-engineering project produces many batches, each with its own preparation conditions and measurements. I handled sample governance through a laboratory information management system, so that every sample could be traced to its preparation and every result to its sample. Alongside that, I kept the regulatory documentation for the serial trials, which meant that each experiment was recorded in a form that a reviewer could follow from protocol to result.

I mention these tasks because they shaped how I now work with data. Traceability is what makes an experiment worth modelling: a dataset whose rows cannot be tied back to conditions teaches a model nothing reliable. When I later built pipelines that regenerate every reported number from raw files, I was applying the sample-tracking habit of this project to code. The experimental design side, varying several formulation parameters together and reading their effects jointly, is also the same logic that nested validation and pre-registered gates express in a computational setting.

The project is in my CV with the limits of my role stated, as it is here. It was my first sustained work on a delivery system whose performance depends on particle structure, and it set the direction toward the question of predicting that performance.
