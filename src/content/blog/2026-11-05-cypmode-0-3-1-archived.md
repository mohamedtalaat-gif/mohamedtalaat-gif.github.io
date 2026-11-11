---
title: CYPMode 0.3.1 archived with a DOI
date: "2026-11-05"
summary: The code, method report, audit, and the analysis against the released labels are archived on Zenodo with a DOI and on Software Heritage.
topic: release
---

On 5 November 2026 I archived release 0.3.1 of CYPMode on Zenodo under the DOI 10.5281/zenodo.23816450. The same release is kept in the Software Heritage archive. The archived version contains the code, the method report, the negative-results ledger, the audit, and the analysis of the entries against the labels and structures that the organisers released after the deadline.

A repository on a hosting platform is not an archive. A repository can be edited, renamed, or deleted, and a link to it can stop working. An archive deposit gives a release an identifier that does not change, so a paper, a CV, or a collaborator can cite exactly the version that produced a result. Zenodo provides a DOI for that purpose, and Software Heritage keeps a copy of the source under its own identifier, which does not depend on any one platform. I used both, because they fail in different ways and each protects against the loss of the other.

The release carries three licences, because the contents differ. The source code is under the GNU Affero General Public License, version 3 or later, with additional terms that require attribution to be preserved. The documents, such as the method report, the README, and the figures, are under CC BY-NC-SA 4.0. The data that the code generates and the deposited data record are under CC BY 4.0, so that they can be reused freely with credit. A NOTICE file and a REUSE statement say which licence covers which file, because a single licence for everything would either restrict the data unnecessarily or leave the code unprotected.

Reproducibility is built into the release. An audit regenerates every number in the reports from the data and compares it with the text, and it passes 125 checks. The test suite has 1,104 tests. The audit is the reason I can state the numbers in this site's validation reports with confidence: each is tied to a file and a rule, and a mismatch would fail the audit. A CITATION file lets a repository host generate a citation automatically, and the usage and citation notes state how to credit the work.

The release also includes what did not work. The 187 pre-registered verdicts, with their 178 failures, are in the repository as a ledger, and the analysis against the released labels shows where the entries fell short. I decided early that these would be part of the archived record, because a deposit that kept only the successes would give a false impression of how the project went. A future reader who wants to build on the work will learn more from the failures than from the successes, and may avoid repeating them.

The final boards were published the same day, which gave the release a natural point at which to freeze. The post that follows this one describes what the boards showed. Both the archive and the boards are in my news feed, and the DOI is on my publications page and Google Scholar profile once indexed.
