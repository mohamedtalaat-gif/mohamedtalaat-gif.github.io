---
title: Stanford Medicine Data Ocean course on agentic AI in healthcare
date: "2026-11-03"
summary: A forty-hour online certificate from the Department of Genetics at Stanford Medicine on agentic AI in healthcare.
topic: course
---

On 3 November 2026 I received the certificate for "Agentic AI in Healthcare", a forty-hour online course from Stanford Medicine Data Ocean, offered by the Department of Genetics. It is the second certificate I have earned from this programme, after the course on data science in precision medicine in March 2025. The verification page for the certificate is linked on the Activities page.

The course concerns systems that take a goal, plan a series of steps, use tools, and act on the results, in contrast to a model that answers a single query. In healthcare such systems are being proposed for tasks like drafting documentation, retrieving evidence, supporting triage, and coordinating information across records. The same property that makes them useful, that they act with some autonomy over several steps, is what makes them hard to evaluate and to trust.

That difficulty is where the course meets my own work. A system that chains steps can fail at any link, and the failure may not show in the final output. Evaluating it therefore needs more than a score on the end result. It needs records of the intermediate steps, comparators, held-out cases that resemble the real situation of use, and an account of failure modes. I have spent the year building habits for this kind of evaluation in a different setting. The pre-registered gates, the permuted-label controls, and the byte-level audits in CYPMode, as well as the scaffold splits in CEREBRO-X, are ways to make a claim about a model's behaviour checkable. The same ideas apply to a system that acts.

Healthcare adds its own requirements. Decisions affect patients, errors can be severe, data are sensitive, and the people using the system need to understand its limits. These raise questions about oversight, such as where a human must review an action, and about provenance, such as being able to show where a recommendation came from. In pharmacy, where I work, the model is a familiar one: independent checks at the points where an error would be costly, and records that allow anyone to reconstruct what happened. An agentic system in a pharmacy workflow would have to meet the same standard.

I took the course on top of my regular work and treat it as continuing education. The CV lists it in one line under education. I include it as a news item because of how it fits with the rest of what I released this autumn: it is a reminder that building a model is the first step, and that showing it works, and where it does not, is the part that earns trust. The validation reports on this site are my attempt at that part for the models I build, and the course gave me a vocabulary for extending the attempt to systems that act.

Two days after the certificate, the final boards of the OpenADMET challenge were published, which I describe in the next post.
