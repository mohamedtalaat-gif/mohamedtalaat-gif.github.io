// Validation reports. `methods` holds validation methods only (procedures that test a model), counted by distinct name. Every number here is quoted from the repository named in `source`.
// Project reports: CYPMode (METHOD_REPORT.md, README.md), CEREBRO-X (README.md), PharmAMP (README.md).

export type Project = 'CYPMode' | 'CEREBRO-X' | 'PharmAMP';

export type Chart =
  | { type: 'bars'; max: number; ref?: { value: number; label: string }; items: { label: string; value: number }[] }
  | { type: 'pairs'; min: number; max: number; aLabel: string; bLabel: string; lowerIsBetter?: boolean; items: { label: string; a: number; b: number; lo?: number; hi?: number }[] }
  | { type: 'intervals'; min: number; max: number; refLabel: string; items: { label: string; est: number; lo: number; hi: number; ref: number }[] }
  | { type: 'diverging'; items: { label: string; value: number }[] }
  | { type: 'gates'; total: number; met: number };

export interface Report {
  slug: string;
  date: string;
  title: string;
  project: Project;
  summary: string;
  endpoints: string[];
  datasets: string[];
  methods: string[];
  headline: { value: string; label: string }[];
  body: string[];
  chart: Chart;
  caption: string;
  source: { label: string; href: string };
  related?: { label: string; href: string };
}

const CYP = 'https://github.com/mohamedtalaat-gif/CYPMode';
const OA = 'OpenADMET CYP inhibition challenge data';

export const reports: Report[] = [
  {
    slug: 'structure-entry',
    date: '2026-11-05',
    title: 'CYP3A4 structure entry against the Boltz-2 baseline',
    project: 'CYPMode',
    summary: 'A restrained co-folding entry scores 0.413 LDDT-PLI, indistinguishable from the published baseline at 0.420.',
    endpoints: ['CYP3A4 ligand structure'],
    datasets: ['OpenADMET released CYP3A4 structures'],
    methods: ['Held-out external data', 'Pre-registered gates'],
    headline: [
      { value: '0.413', label: 'LDDT-PLI of the entry (±0.030)' },
      { value: '0.420', label: 'published Boltz-2 baseline' },
      { value: '15 of 38', label: 'place on the final board' },
    ],
    body: [
      'The entry used Boltz-2 co-folding with a restraint that pulls a ligand nitrogen toward the heme iron. After the deadline the organisers released the crystal structures, which made a direct comparison possible.',
      'The entry cannot be told apart from the baseline. If the best of the poses generated for each compound had been chosen instead, the mean score would have been 0.526, so most of the gap lies in choosing the pose and not in generating it. A different selection threshold would have added at most 0.034, against a gap of 0.126 to the first place.',
      'The restraint found all four ligands that coordinate the iron in the crystals. It also placed a nitrogen close to the iron for eight further ligands (2.75 to 4.93 Å in the released structures), which the crystals do not show.',
    ],
    chart: {
      type: 'bars',
      max: 0.6,
      items: [
        { label: 'CYPMode entry', value: 0.413 },
        { label: 'Boltz-2 baseline', value: 0.42 },
        { label: 'Best pose in each pool', value: 0.526 },
      ],
    },
    caption: 'Mean LDDT-PLI over the scored ligands. The last bar is an upper bound that needs the answer to choose the pose; it is not an achievable score.',
    source: { label: 'CYPMode method report', href: `${CYP}/blob/main/METHOD_REPORT.md` },
    related: { label: 'Open the poses', href: '/visualization/poses/' },
  },
  {
    slug: 'tdi-nested-cv',
    date: '2026-11-05',
    title: 'Time-dependent inhibition: nested cross-validation and the final board',
    project: 'CYPMode',
    summary: 'Nested cross-validation on the scored population gives AUC 0.73 to 0.86; the blind board gave a macro MCC of 0.372 and a rank of 14th of 62.',
    endpoints: ['Time-dependent CYP inhibition'],
    datasets: [OA],
    methods: ['Nested cross-validation', 'Held-out external data'],
    headline: [
      { value: '0.3723', label: 'macro MCC on the board (±0.0378)' },
      { value: '14 of 62', label: 'place on the final board' },
      { value: '0.862', label: 'nested AUC, CYP3A4 at z0 = 1.96' },
    ],
    body: [
      'Model selection and the reported AUC come from separate loops. The inner loop picks the model and its calibration; the outer loop, which never influenced either choice, is what the figures below report.',
      'The two label thresholds tried (z0 = 1.96 and 1.0) change the AUC by 0.02 to 0.03 for either enzyme. CYP2D6 is the harder endpoint at both.',
    ],
    chart: {
      type: 'pairs',
      min: 0.5,
      max: 1,
      aLabel: 'z0 = 1.96',
      bLabel: 'z0 = 1.0',
      items: [
        { label: 'CYP3A4', a: 0.862, b: 0.834 },
        { label: 'CYP2D6', a: 0.754, b: 0.731 },
      ],
    },
    caption: 'Outer-loop AUC of nested cross-validation on the scored population.',
    source: { label: 'CYPMode README', href: `${CYP}#readme` },
  },
  {
    slug: 'selection-aware-cyp2d6',
    date: '2026-11-05',
    title: 'A selection-aware CYP2D6 model',
    project: 'CYPMode',
    summary: 'Modelling how compounds came to be tested raises CYP2D6 AUC from 0.562 to 0.728 on a set that resembles the training panel.',
    endpoints: ['Time-dependent CYP inhibition'],
    datasets: [OA],
    methods: ['Pre-registered gates', 'Multiple-comparison correction'],
    headline: [
      { value: '+0.1660', label: 'change in AUC' },
      { value: 'p = 0.026', label: 'after correction' },
    ],
    body: [
      'Compounds were not tested on every enzyme at random, so the labels that exist are a selected sample. A model of that selection improved CYP2D6 on a scored set that looks like the training panel.',
      'Which file to submit was decided by a rule written before any upload. A hedged blend of the hits-only and selection-aware stacks was tried as well and did not pass its gate.',
    ],
    chart: { type: 'pairs', min: 0.5, max: 1, aLabel: 'without the selection model', bLabel: 'with it', items: [{ label: 'CYP2D6', a: 0.5618, b: 0.7278 }] },
    caption: 'AUC on a scored set that resembles the training panel.',
    source: { label: 'CYPMode README', href: `${CYP}#readme` },
  },
  {
    slug: 'calibration',
    date: '2026-11-05',
    title: 'Calibration of the published probabilities',
    project: 'CYPMode',
    summary: 'Isotonic calibration brings the expected calibration error to 0.019 for CYP3A4 and 0.005 for CYP2D6; the raw CYP2D6 blend was a ranking, not a probability.',
    endpoints: ['Time-dependent CYP inhibition'],
    datasets: [OA],
    methods: ['Calibration analysis', 'Nested cross-validation'],
    headline: [
      { value: '0.0189', label: 'ECE, CYP3A4' },
      { value: '0.0054', label: 'ECE, CYP2D6' },
      { value: '0.3592', label: 'ECE of the raw CYP2D6 blend' },
    ],
    body: [
      'A calibration method was accepted only if the expected calibration error was at most 0.05 and the calibration slope lay between 0.8 and 1.2, with the choice made on the inner folds.',
      'The raw output of the CYP2D6 blend fails that gate by a wide margin. It ranks compounds and transfers a call rate, but its numbers are not probabilities until calibrated, and the report states this as a limitation.',
    ],
    chart: { type: 'pairs', min: 0, max: 0.4, lowerIsBetter: true, aLabel: 'raw output', bLabel: 'after isotonic calibration', items: [{ label: 'CYP3A4', a: 0.0431, b: 0.0189 }, { label: 'CYP2D6', a: 0.3592, b: 0.0054 }] },
    caption: 'Expected calibration error; lower is better.',
    source: { label: 'CYPMode method report', href: `${CYP}/blob/main/METHOD_REPORT.md` },
  },
  {
    slug: 'permutation-control',
    date: '2026-11-05',
    title: 'Negative control on permuted labels',
    project: 'CYPMode',
    summary: 'With the labels permuted and the whole nested procedure repeated, the outer AUC is 0.510 and 0.501, as chance requires.',
    endpoints: ['Time-dependent CYP inhibition'],
    datasets: [OA],
    methods: ['Permuted-label control', 'Nested cross-validation'],
    headline: [
      { value: '0.5096', label: 'outer AUC, CYP3A4' },
      { value: '0.5012', label: 'outer AUC, CYP2D6' },
    ],
    body: [
      'A pipeline that tunes many choices can find signal in noise. The control permutes the labels of the pool and repeats the entire nested procedure, including model selection. A result near 0.5 shows that the procedure itself does not leak.',
    ],
    chart: { type: 'bars', max: 1, ref: { value: 0.5, label: 'chance' }, items: [{ label: 'CYP3A4', value: 0.5096 }, { label: 'CYP2D6', value: 0.5012 }] },
    caption: 'Outer AUC on permuted labels at z0 = 1.0.',
    source: { label: 'CYPMode method report', href: `${CYP}/blob/main/METHOD_REPORT.md` },
  },
  {
    slug: 'label-shift',
    date: '2026-11-05',
    title: 'Estimating the positive rate without a board',
    project: 'CYPMode',
    summary: 'A label-shift estimate that reads no leaderboard is too wide to confirm or contradict the board-derived rates.',
    endpoints: ['Time-dependent CYP inhibition'],
    datasets: [OA],
    methods: ['Label-shift estimation', 'Pre-registered gates'],
    headline: [
      { value: '0.135', label: 'CYP2D6 estimate (0.043 to 0.286)' },
      { value: '0.352', label: 'CYP3A4 estimate (0.274 to 0.451)' },
    ],
    body: [
      'The one piece of aggregate information about the hidden labels that the entry uses is the positive rate of the scored set, which the public boards make recoverable. A second estimate, from a classifier that scores held-out compounds and the blinded structures on one scale and reads no board, checks that rate.',
      'Under the rule fixed before the first run, both verdicts are NOT INFORMATIVE. Each interval contains the board-derived rate, so the check neither supports nor contradicts it.',
    ],
    chart: { type: 'intervals', min: 0, max: 0.6, refLabel: 'rate from the boards', items: [{ label: 'CYP2D6', est: 0.135, lo: 0.043, hi: 0.286, ref: 0.059 }, { label: 'CYP3A4', est: 0.352, lo: 0.274, hi: 0.451, ref: 0.31 }] },
    caption: 'Estimated positive rate with its interval, against the rate recovered from the boards.',
    source: { label: 'CYPMode README', href: `${CYP}#readme` },
  },
  {
    slug: 'gate-ledger',
    date: '2026-11-05',
    title: 'The ledger of 187 gates',
    project: 'CYPMode',
    summary: 'Every idea had to beat its reference under a rule fixed before the run. Nine of 187 verdicts were met; the 178 that were not are published.',
    endpoints: ['Time-dependent CYP inhibition', 'CYP3A4 ligand structure'],
    datasets: [OA, 'OpenADMET released CYP3A4 structures'],
    methods: ['Pre-registered gates', 'Regeneration audit', 'Multiple-comparison correction'],
    headline: [
      { value: '187', label: 'pre-registered verdicts in 59 families' },
      { value: '9', label: 'met' },
      { value: '125', label: 'audit checks' },
      { value: '1,104', label: 'tests' },
    ],
    body: [
      'Each addition had to beat its reference at a corrected significance level, alone and inside the final stack, under a rule fixed before the run. The count of 187 is the one number that every document of the project quotes for what was tried.',
      'An audit regenerates every reported number from the data on a clean clone and compares it with the text. The ledger of failed gates is part of the repository, not an appendix to it.',
    ],
    chart: { type: 'gates', total: 187, met: 9 },
    caption: 'One square per verdict. Filled: gate met.',
    source: { label: 'NEGATIVE_RESULTS.md in the repository', href: `${CYP}/blob/main/NEGATIVE_RESULTS.md` },
  },
  {
    slug: 'data-integrity',
    date: '2026-11-12',
    title: 'Data integrity and the label rule',
    project: 'CYPMode',
    summary: 'The label rule reproduces all 3,827 training labels that have both measurements, and none of the 750 test compounds appears in the training file.',
    endpoints: ['Time-dependent CYP inhibition'],
    datasets: [OA],
    methods: ['Data integrity audit', 'Regeneration audit'],
    headline: [
      { value: '0', label: 'label-rule mismatches in 3,827 rows' },
      { value: '0', label: 'test compounds also in the training file' },
      { value: '17 of 17', label: 'integrity checks passed' },
    ],
    body: [
      'The label of a compound is a threshold on two measured potencies, one from the time-dependent arm and one from the direct-inhibition arm. The rule recovered from the data reproduces every training label that has both measurements, 2,334 for CYP3A4 and 1,493 for CYP2D6.',
      'The audit also checks the files themselves. The training file has 6,145 rows and the test file 750, with no invalid structures, no duplicate names or structures in the training file, no test compound matched by structure or by name, and no label column in the test file. The nested folds are disjoint, they cover the pool exactly, and the external compounds never enter it.',
      'A further 1,249 CYP3A4 rows have no direct-inhibition measurement and follow a different convention from the test set, so they are excluded from the CYP3A4 pool. The organisers confirmed that convention after the deadline.',
    ],
    chart: { type: 'gates', total: 17, met: 17 },
    caption: 'One square per check: seven file checks, two label-rule checks (one for each enzyme), and eight checks of the nested plan (four for each enzyme). Filled: passed.',
    source: { label: 'CYPMode method report, section 2', href: `${CYP}/blob/main/METHOD_REPORT.md` },
  },
  {
    slug: 'label-rule-agreement',
    date: '2026-11-12',
    title: 'The label rule against the organisers’ released labels',
    project: 'CYPMode',
    summary: 'After the deadline the rule gave the organisers’ label for all 1,488 test compounds it could be applied to, with no disagreement.',
    endpoints: ['Time-dependent CYP inhibition'],
    datasets: [OA],
    methods: ['Held-out external data'],
    headline: [
      { value: '1,488 of 1,488', label: 'labels given by the rule that match' },
      { value: '0', label: 'disagreements' },
      { value: '750 and 748', label: 'test compounds scored for CYP3A4 and for CYP2D6' },
    ],
    body: [
      'The rule was recovered from the training labels alone. The released test labels are the first data it had not seen, so they test it directly: 747 of the 750 labelled CYP3A4 compounds and 741 of the 748 labelled CYP2D6 compounds match, and the remaining ten are compounds that the rule cannot be applied to because a measurement is missing. No compound disagrees.',
      'The organisers score 750 CYP3A4 compounds and 748 CYP2D6 compounds, which is nearly the whole test set. The scored set is therefore not a subset filtered by the confidence of the label, as the project had assumed when it built its yardstick, and the report records that limitation as corrected.',
    ],
    chart: {
      type: 'pairs',
      min: 0,
      max: 800,
      aLabel: 'compounds with a released label',
      bLabel: 'compounds where the rule gives the same label',
      items: [
        { label: 'CYP3A4', a: 750, b: 747 },
        { label: 'CYP2D6', a: 748, b: 741 },
      ],
    },
    caption: 'Compounds of the test set. The gap in each row is compounds to which the rule cannot be applied; none is a disagreement.',
    source: { label: 'CYPMode method report, section 15', href: `${CYP}/blob/main/METHOD_REPORT.md` },
  },
  {
    slug: 'threshold-ceiling',
    date: '2026-11-12',
    title: 'How much a better threshold could have added to the board score',
    project: 'CYPMode',
    summary: 'The best possible threshold on the stored scores raises the macro MCC from 0.372 to 0.405, a gain of 0.034 against a gap of 0.126 to the first place.',
    endpoints: ['Time-dependent CYP inhibition'],
    datasets: [OA],
    methods: ['Held-out external data', 'Oracle threshold analysis'],
    headline: [
      { value: '+0.034', label: 'most that any threshold could add to the macro MCC' },
      { value: '0.126', label: 'gap between the entry and the first place' },
      { value: '0.403', label: 'share of CYP3A4 compounds called positive' },
    ],
    body: [
      'The submitted file calls a compound positive above a threshold fixed before the labels were known. With the released labels the best threshold for each enzyme can be found afterwards. That number is a ceiling, not a result, because it uses the answer.',
      'The ceiling is 0.518 for CYP3A4 against 0.468 submitted, and 0.293 for CYP2D6 against 0.276. Averaged over the two enzymes it is 0.405 against 0.372. Choosing the threshold perfectly would therefore have closed less than a third of the gap to the first place, so the ranking of the entry reflects its scores and not the cut-off applied to them.',
    ],
    chart: {
      type: 'pairs',
      min: 0,
      max: 0.6,
      aLabel: 'submitted calls',
      bLabel: 'best threshold chosen with the labels',
      items: [
        { label: 'CYP3A4', a: 0.4681, b: 0.5177 },
        { label: 'CYP2D6', a: 0.2756, b: 0.293 },
        { label: 'Mean of the two', a: 0.3718, b: 0.4054 },
      ],
    },
    caption: 'Matthews correlation coefficient on the released test labels. The second value of each row is an upper bound that needs the labels; it is not an achievable score.',
    source: { label: 'CYPMode method report, section 15', href: `${CYP}/blob/main/METHOD_REPORT.md` },
  },
  {
    slug: 'bbb-scaffold-split',
    date: '2026-09',
    title: 'Scaffold split against random split for BBB permeability',
    project: 'CEREBRO-X',
    summary: 'Fingerprint and graph networks score 0.95 or higher on a random split and 0.60 to 0.69 when whole ring systems are held out.',
    endpoints: ['BBB permeability'],
    datasets: ['BBBP (MoleculeNet), 2,039 compounds'],
    methods: ['Scaffold split', 'Uncertainty reporting'],
    headline: [
      { value: '~0.60', label: 'fingerprint network, scaffold split (95% CI 0.53 to 0.68)' },
      { value: '~0.69', label: 'graph network, scaffold split (95% CI 0.61 to 0.76)' },
      { value: '204', label: 'held-out compounds' },
    ],
    body: [
      'A stratified random split lets the same ring systems appear in training and test, which is not the situation of a new drug candidate. The scaffold split removes every test ring system from training, and the deployed models are trained and scored that way.',
      'The random-split figure that the project used to quote overstated how well the fingerprint model handles new chemistry. The intervals overlap, so the better result of the graph model is a data point, not a verdict.',
    ],
    chart: {
      type: 'pairs',
      min: 0.5,
      max: 1,
      aLabel: 'scaffold split',
      bLabel: 'random split',
      items: [
        { label: 'Fingerprint network', a: 0.6, b: 0.965, lo: 0.53, hi: 0.68 },
        { label: 'Graph network', a: 0.69, b: 0.95, lo: 0.61, hi: 0.76 },
      ],
    },
    caption: 'ROC-AUC on 204 held-out compounds; the bar around the scaffold value is its 95% interval. Random-split values are the approximate figures in the README.',
    source: { label: 'CEREBRO-X README', href: 'https://github.com/mohamedtalaat-gif/CEREBRO-X#readme' },
  },
  {
    slug: 'peptide-metrics-wet-lab',
    date: '2026-09',
    title: 'Peptide developability metrics against measured safety data',
    project: 'PharmAMP',
    summary: 'Aggregation propensity and solubility track measured cytotoxicity of 215 designed peptides, but not hemolysis, where half the values are censored.',
    endpoints: ['Peptide cytotoxicity', 'Peptide hemolysis', 'Peptide secondary structure'],
    datasets: ['Measured safety data for 217 designed antimicrobial peptides'],
    methods: ['Held-out external data', 'Uncertainty reporting'],
    headline: [
      { value: '−0.20', label: 'aggregation propensity against cytotoxicity (p = 0.004)' },
      { value: '+0.19', label: 'solubility against cytotoxicity (p = 0.006)' },
      { value: '−0.40', label: 'aggregation propensity against measured β-sheet content' },
    ],
    body: [
      'The two metrics were not fitted to these data. The measurements are an independent test of whether the heuristics track anything real.',
      'Both metrics correlate with cytotoxicity in the expected direction. Neither correlates significantly with hemolysis (p between 0.09 and 0.18), but 50.2% of hemolysis values are recorded as above the assay ceiling, so that null carries real uncertainty. The tool reports the censored fraction beside every correlation.',
      'Aggregation propensity correlates negatively with measured β-sheet content, the opposite of what its source on amyloid formation would predict. The most likely reading is that, for helical antimicrobial peptides, the metric tracks membrane-disruptive character and not β-sheet aggregation, which argues for renaming or reworking it.',
    ],
    chart: {
      type: 'diverging',
      items: [
        { label: 'Aggregation propensity, cytotoxicity (CC50)', value: -0.2 },
        { label: 'Solubility, cytotoxicity (CC50)', value: 0.19 },
        { label: 'Aggregation propensity, β-sheet content', value: -0.4 },
      ],
    },
    caption: 'Spearman correlation coefficients, n = 215 peptides with measurements.',
    source: { label: 'PharmAMP README', href: 'https://github.com/mohamedtalaat-gif/PharmAMP#readme' },
  },
];

export const sortedReports = [...reports].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
export const uniq = (f: (r: Report) => string[]) => new Set(reports.flatMap(f)).size;
