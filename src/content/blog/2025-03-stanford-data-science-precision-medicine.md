---
title: Stanford Medicine Data Ocean course on data science in precision medicine
date: "2025-03-17"
summary: A forty-hour online certificate from the Department of Genetics at Stanford Medicine on the fundamentals of data science in precision medicine and cloud computing.
topic: course
news: true
---

On 17 March 2025 I received the certificate for "Fundamentals of Data Science in Precision Medicine and Cloud Computing", a forty-hour online course from Stanford Medicine Data Ocean, run by the Department of Genetics. The certificate can be checked online through its verification page, which is linked on the Activities page.

The title names two subjects that are usually taught separately. Precision medicine is the idea that treatment should depend on the individual patient's characteristics, such as genetic variants, biomarkers and clinical history, and not on the average patient. Cloud computing is the infrastructure on which the large datasets of modern biomedicine are stored and analysed. The course brings them together because the first now depends on the second: the data behind precision medicine are too large and too varied to handle on a single laptop.

For a pharmacist working in computational pharmaceutics, the relevance is close. Pharmacogenomics, the study of how genetic variation changes drug response, is the most developed part of precision medicine in my field. Variants in drug-metabolising enzymes explain why the same dose of the same drug can be too little for one patient and too much for another. My own recent work concerns a family of such enzymes, the cytochromes P450, and the course gave me a clearer picture of the data pipelines through which that kind of knowledge reaches clinical use.

Two skills from the course show up in my work. The first is thinking about data as an object with provenance. A dataset used for precision medicine comes from particular patients, instruments and processing steps, and conclusions are only as valid as that chain. This is the point I emphasise in my validation reports, where the population on which a model is scored matters as much as the model. The second is working with analysis in a reproducible environment, where code, data and results are tied together so that another person can rerun them. The repositories I released in 2026 follow that pattern.

The course also made me more sceptical in a useful way. Machine-learning models on biomedical data are prone to leakage, where information from the test set reaches the training set through shared patients, batches or structure, and to inflated scores when splits are chosen carelessly. I had met this problem in cheminformatics, where a random split puts near-identical molecules on both sides. Seeing it in a different domain confirmed that it is general, and that the remedy is the same: split so that the test data resemble the situation of use, and report the result with its uncertainty.

I took the course alongside full-time work, and I treat it as an addition to my training and not as research. The CV mentions it in a single line within the education section. I include it as a news item because it was a step in a sequence: this course in March 2025, a second one from the same programme in November 2026, and in between the work on the OpenADMET challenge that put the ideas into practice.
