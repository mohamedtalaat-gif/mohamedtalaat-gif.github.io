// Which report answers which question of a model validation, for each model. A cell lists the slugs of the reports that answer the question for that model; an empty cell is a question that no report
// of the collection answers yet.

export const models = [
  { id: 'tdi', label: 'CYPMode, time-dependent inhibition' },
  { id: 'structure', label: 'CYPMode, structure and iron-contact screen' },
  { id: 'cerebro', label: 'CEREBRO-X' },
  { id: 'pharmamp', label: 'PharmAMP' },
] as const;

export interface Question {
  question: string;
  asks: string;
  cells: Partial<Record<(typeof models)[number]['id'], string[]>>;
}

export const questions: Question[] = [
  {
    question: 'Are the data and the labels what they claim to be?',
    asks: 'Duplicates, leaks between the training and the test files, and a label rule that reproduces the labels that were given.',
    cells: { tdi: ['data-integrity', 'label-rule-agreement'] },
  },
  {
    question: 'Can the split leak?',
    asks: 'Nested cross-validation, a holdout built like the test set, scaffold splits, and a control with permuted labels.',
    cells: { tdi: ['tdi-nested-cv', 'permutation-control', 'test-like-holdout'], cerebro: ['bbb-scaffold-split'] },
  },
  {
    question: 'Does it hold on data that the method never saw?',
    asks: 'Released labels and structures, independent releases, independent pipelines, and measurements that were never fitted.',
    cells: {
      tdi: ['threshold-ceiling', 'octant-potency-check', 'tdi-reference-panel'],
      structure: ['structure-entry', 'first-entry-comparison', 'iron-contact-structures', 'independent-contact-fingerprints'],
      pharmamp: ['peptide-metrics-wet-lab'],
    },
  },
  {
    question: 'Are the probabilities and the uncertainty honest?',
    asks: 'Calibration, an uncertainty signal from a committee of models, and the similarity to the training data within which a prediction is reliable.',
    cells: { tdi: ['calibration', 'committee-uncertainty', 'applicability-domain'] },
  },
  {
    question: 'What happens when the test set is selected or shifted?',
    asks: 'A model of how compounds came to be tested, and an estimate of the positive rate that reads no board.',
    cells: { tdi: ['selection-aware-cyp2d6', 'label-shift'] },
  },
  {
    question: 'Were the additions held to a rule, and what failed?',
    asks: 'Gates registered before the run, a correction for the number of attempts, and the negative results.',
    cells: { tdi: ['gate-ledger', 'final-stack-additions'], structure: ['structure-levers', 'ligand-dynamics', 'relaxation-gate'] },
  },
  {
    question: 'Can the numbers be rebuilt?',
    asks: 'The scoring of the organisers on the released data, and an audit on a clean clone.',
    cells: { tdi: ['board-reproduction', 'clean-clone-reproduction'], structure: ['board-reproduction', 'clean-clone-reproduction'] },
  },
];
