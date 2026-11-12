// The interactive part of the validation reports: for each report that has a table of its own, the rows (read from the CYPMode repository by scripts/extract-validation-data.py), the controls that filter and
// sort them, and the way that the rows that remain are drawn. The engine is src/lib/explore.js. A report that is not listed here shows the values of its chart as a table.

import agreement from './agreement.json';
import applicability from './applicability.json';
import board from './board.json';
import calibration from './calibration.json';
import committee from './committee.json';
import dynamics from './dynamics.json';
import firstEntry from './first_entry.json';
import holdout from './holdout.json';
import integrity from './integrity.json';
import labelShift from './label_shift.json';
import nested from './nested.json';
import permutation from './permutation.json';
import ledger from './ledger.json';
import relaxation from './relaxation.json';
import selection from './selection.json';
import threshold from './threshold.json';

const options = (values: string[], all?: string) => [...(all ? [{ value: '*', label: all }] : []), ...values.map((v) => ({ value: v, label: v }))];
const uniq = (rows: Record<string, any>[], key: string) => [...new Set(rows.map((r) => r[key] as string))];
const col = (key: string, label: string, digits?: number) => ({ key, label, ...(digits !== undefined ? { digits } : {}) });

const SCORES: Record<string, string> = {
  dynamic_pharmacophore: 'Dynamic pharmacophore',
  stability: 'Stability under dynamics',
  dynamic_combined: 'Dynamic combined',
  static_pharmacophore_model: 'Static pharmacophore model',
};

const gap = (a: number, b: number) => Number((a - b).toFixed(6));
const entries = firstEntry.rows.map((r) => ({
  ...r,
  d_pli_sub: gap(r.external_pli, r.submitted_pli),
  d_pli_base: gap(r.external_pli, r.baseline_pli),
  d_bisy_sub: gap(r.submitted_bisy, r.external_bisy), // the sign is reversed so that a positive value is better for every metric
  d_bisy_base: gap(r.baseline_bisy, r.external_bisy),
  d_lp_sub: gap(r.external_lp, r.submitted_lp),
  d_lp_base: gap(r.external_lp, r.baseline_lp),
}));

const pairsFirst = (metric: string, other: 'submitted' | 'baseline', min: number, max: number) => ({
  when: { metric, other },
  type: 'pairs',
  label: 'Ligand {ligand}',
  a: `external_${metric === 'LDDT-PLI' ? 'pli' : metric === 'LDDT-LP' ? 'lp' : 'bisy'}`,
  b: `${other}_${metric === 'LDDT-PLI' ? 'pli' : metric === 'LDDT-LP' ? 'lp' : 'bisy'}`,
  aLabel: 'first-ranked entry',
  bLabel: other === 'submitted' ? 'submitted poses' : 'organisers’ baseline',
  min,
  max,
  tip: `Ligand {ligand}: first-ranked entry {external_${metric === 'LDDT-PLI' ? 'pli' : metric === 'LDDT-LP' ? 'lp' : 'bisy'}:3}, submitted {submitted_${metric === 'LDDT-PLI' ? 'pli' : metric === 'LDDT-LP' ? 'lp' : 'bisy'}:3}, baseline {baseline_${metric === 'LDDT-PLI' ? 'pli' : metric === 'LDDT-LP' ? 'lp' : 'bisy'}:3}; best of {pool_poses} poses of the pool {pool_best:3}`,
});

const stackRows = [
  ['default', 23, 'z0 = 1.0', 0.817, 0.4415, null, null],
  ['default + chemprop_foundation', 25, 'z0 = 1.0', 0.8303, 0.4707, 0.0133, 0.0024],
  ['default + neural', 26, 'z0 = 1.0', 0.8276, 0.4609, 0.0106, 0.0142],
  ['default + both groups', 28, 'z0 = 1.0', 0.8338, 0.476, 0.0168, 0.0002],
  ['default', 23, 'z0 = 1.96', 0.8443, 0.4867, null, null],
  ['default + chemprop_foundation', 25, 'z0 = 1.96', 0.8587, 0.5286, 0.0144, 0.0053],
  ['default + neural', 26, 'z0 = 1.96', 0.855, 0.5131, 0.0106, 0.0294],
  ['default + both groups', 28, 'z0 = 1.96', 0.8622, 0.5388, 0.0179, 0.0009],
].map(([stack, n, cut, auc, mcc, diff, p]) => ({ stack, candidates: n, cut, auc, mcc, difference: diff, p, default_auc: cut === 'z0 = 1.0' ? 0.817 : 0.8443 }));

export const explores: Record<string, any> = {
  'permutation-control': {
    title: 'Explore the negative control',
    lede: 'The outer-loop result on the real labels and on labels that were permuted over the whole pool before the nested procedure ran. The line is the range over the permutations.',
    noun: 'results',
    source: 'data/structure_track/outputs/cyp3a4/logs/permutation_control_CYP3A4.log and permutation_control_CYP2D6.log',
    columns: [col('enzyme', 'Enzyme'), col('cut', 'Confidence cut'), col('pool', 'Compounds in the pool'), col('permutations', 'Permutations'), col('real_auc', 'AUC, real labels', 4), col('perm_auc', 'AUC, permuted', 4), col('perm_lo', 'Permuted, lowest', 4), col('perm_hi', 'Permuted, highest', 4), col('real_mcc', 'MCC, real labels', 4), col('perm_mcc', 'MCC, permuted', 4), col('mcc_lo', 'MCC permuted, lowest', 4), col('mcc_hi', 'MCC permuted, highest', 4)],
    rows: permutation.rows,
    controls: [
      { id: 'enzyme', type: 'filter', key: 'enzyme', label: 'Enzyme', options: options(uniq(permutation.rows, 'enzyme'), 'Both enzymes') },
      { id: 'metric', type: 'view', label: 'Show', options: [{ value: 'AUC', label: 'AUC' }, { value: 'MCC', label: 'MCC' }] },
    ],
    charts: [
      { when: { metric: 'AUC' }, type: 'pairs', label: '{enzyme}, {cut}', a: 'perm_auc', b: 'real_auc', lo: 'perm_lo', hi: 'perm_hi', aLabel: 'permuted labels', bLabel: 'real labels', min: 0.4, max: 1, tip: '{enzyme}, {cut}: AUC {real_auc:4} on the real labels; {perm_auc:4} on permuted labels (range {perm_lo:4} to {perm_hi:4} over {permutations} permutations of the {pool} labels)' },
      { when: { metric: 'MCC' }, type: 'pairs', label: '{enzyme}, {cut}', a: 'perm_mcc', b: 'real_mcc', lo: 'mcc_lo', hi: 'mcc_hi', aLabel: 'permuted labels', bLabel: 'real labels', min: -0.1, max: 0.5, tip: '{enzyme}, {cut}: MCC {real_mcc:4} on the real labels; {perm_mcc:4} on permuted labels (range {mcc_lo:4} to {mcc_hi:4} over {permutations} permutations)' },
    ],
  },

  'committee-uncertainty': {
    title: 'Explore the committee',
    lede: 'Adding the committee of models to the final stack, at the two confidence cuts, and the calibration of the probability of the committee as it comes out. The gate was a corrected p below 0.05 at both cuts.',
    noun: 'results',
    source: 'data/structure_track/outputs/cyp3a4/logs/committee_label_model_CYP3A4.log and committee_label_model_CYP2D6.log',
    columns: [col('enzyme', 'Enzyme'), col('cut', 'Confidence cut'), col('change', 'Change in AUC of the stack', 4), col('p', 'p', 3), col('better', 'Folds with a gain'), col('auc_m', 'AUC, member m', 4), col('auc_p', 'AUC, member p', 4), col('auc_ei', 'AUC, member ei', 4), col('ece', 'Expected calibration error', 4), col('brier', 'Brier score', 4), col('slope', 'Slope', 3), col('mean_pred', 'Mean predicted', 3), col('mean_obs', 'Mean observed', 3)],
    rows: committee.rows,
    controls: [
      { id: 'enzyme', type: 'filter', key: 'enzyme', label: 'Enzyme', options: options(uniq(committee.rows, 'enzyme'), 'Both enzymes') },
      { id: 'metric', type: 'view', label: 'Show', options: [{ value: 'change', label: 'Change in AUC of the stack' }, { value: 'ece', label: 'Calibration of the committee' }] },
    ],
    charts: [
      { when: { metric: 'change' }, type: 'diverging', span: 0.01, label: '{enzyme}, {cut}', value: 'change', tip: '{enzyme}, {cut}: the AUC of the stack changes by {change:4} (p {p:3}; a gain in {better} outer folds); the AUC of the members is {auc_m:3}, {auc_p:3}, and {auc_ei:3}' },
      { when: { metric: 'ece' }, type: 'bars', label: '{enzyme}, {cut}', value: 'ece', max: 0.4, ref: { value: 0.05, label: 'limit' }, tip: '{enzyme}, {cut}: expected calibration error {ece:4}, Brier {brier:4}, slope {slope:3}; mean predicted {mean_pred:3} against observed {mean_obs:3}' },
    ],
  },

  'label-shift': {
    title: 'Explore the estimates',
    lede: 'The estimate of the positive rate from a classifier that reads no board, for all compounds and for the scored ones, with its 95% interval. The mark is the rate that the public boards give.',
    noun: 'estimates',
    source: 'data/structure_track/outputs/cyp3a4/logs/label_shift.log',
    columns: [col('enzyme', 'Enzyme'), col('cut', 'Confidence cut'), col('classifier', 'Classifier'), col('estimate_of', 'Estimate of'), col('rate', 'Positive rate', 3), col('lo', 'Interval, low', 3), col('hi', 'Interval, high', 3), col('fold_spread', 'Spread over folds', 3)],
    rows: labelShift.rows,
    controls: [
      { id: 'enzyme', type: 'filter', key: 'enzyme', label: 'Enzyme', options: options(['CYP2D6', 'CYP3A4']) },
      { id: 'cut', type: 'filter', key: 'cut', label: 'Confidence cut', options: options(['z0 = 1.0', 'z0 = 1.96']) },
      { id: 'classifier', type: 'filter', key: 'classifier', label: 'Classifier', options: options(['lgbm_A+fps_deep', 'lgbm_A_deep']) },
    ],
    charts: [
      { when: { enzyme: 'CYP2D6' }, type: 'intervals', label: '{estimate_of}', est: 'rate', lo: 'lo', hi: 'hi', ref: 0.059, min: 0, max: 0.6, refLabel: 'rate from the boards', tip: '{enzyme}, {cut}, {classifier}: {estimate_of} {rate:3} ({lo:3} to {hi:3}); spread over folds {fold_spread:3}' },
      { when: { enzyme: 'CYP3A4' }, type: 'intervals', label: '{estimate_of}', est: 'rate', lo: 'lo', hi: 'hi', ref: 0.31, min: 0, max: 0.6, refLabel: 'rate from the boards', tip: '{enzyme}, {cut}, {classifier}: {estimate_of} {rate:3} ({lo:3} to {hi:3}); spread over folds {fold_spread:3}' },
    ],
  },

  'selection-aware-cyp2d6': {
    title: 'Explore the dependence on the scored set',
    lede: `A weight of 1.0 is a scored set that holds as many never-promoted compounds as the training panel, and a lower weight holds fewer. The estimate for the blinded compounds is ${selection.meta.estimate} (95%: ${selection.meta.lo} to ${selection.meta.hi}). Where the lines cross, the hits-only stack is better than the selection-aware one.`,
    noun: 'weights',
    source: 'METHOD_REPORT.md, section 7',
    columns: [col('cut', 'Confidence cut'), col('weight', 'Non-hit weight', 2), col('s0_auc', 'AUC, hits-only', 3), col('s1_auc', 'AUC, + gate', 3), col('s2_auc', 'AUC, + two-part', 3), col('s3_auc', 'AUC, + end-to-end', 3), col('s0_mcc', 'MCC, hits-only', 3), col('s1_mcc', 'MCC, + gate', 3), col('s2_mcc', 'MCC, + two-part', 3), col('s3_mcc', 'MCC, + end-to-end', 3)],
    rows: selection.rows,
    controls: [
      { id: 'cut', type: 'filter', key: 'cut', label: 'Confidence cut', options: options(['z0 = 1.0', 'z0 = 1.96']) },
      { id: 'stack', type: 'view', label: 'Selection-aware stack', options: [{ value: 's3', label: 'End-to-end (S3)' }, { value: 's2', label: 'Two-part (S2)' }, { value: 's1', label: 'With the gate (S1)' }] },
    ],
    charts: ['s3', 's2', 's1'].map((v) => ({
      when: { stack: v },
      type: 'pairs',
      label: 'Non-hit weight {weight:2}',
      a: 's0_auc',
      b: `${v}_auc`,
      aLabel: 'hits-only stack',
      bLabel: v === 's3' ? 'end-to-end stack' : v === 's2' ? 'two-part stack' : 'stack with the gate',
      min: 0.5,
      max: 0.8,
      tip: `Non-hit weight {weight:2}, {cut}: AUC {s0_auc:3} hits-only, {s1_auc:3} with the gate, {s2_auc:3} two-part, {s3_auc:3} end-to-end`,
    })),
  },

  'tdi-nested-cv': {
    position: 'after',
    title: 'Explore the candidates',
    lede: 'The AUC of each single candidate over the whole pool, as the mean of its 15 outer folds of the stored out-of-fold predictions (the line is the lowest and the highest fold). The final stack is measured on the scored population and is higher; this is the ground that it was built from.',
    noun: 'candidates',
    source: 'explorer/public/oof_CYP3A4.csv.gz and oof_CYP2D6.csv.gz',
    columns: [col('enzyme', 'Enzyme'), col('candidate', 'Candidate'), col('family', 'Family'), col('mean_auc', 'AUC, mean of 15 folds', 4), col('min_auc', 'Lowest fold', 4), col('max_auc', 'Highest fold', 4), col('pool', 'Compounds in the pool')],
    rows: nested.rows,
    controls: [
      { id: 'enzyme', type: 'filter', key: 'enzyme', label: 'Enzyme', options: options(['CYP3A4', 'CYP2D6']) },
      { id: 'family', type: 'filter', key: 'family', label: 'Family', options: options([...new Set(nested.rows.map((r) => r.family as string))].sort(), 'All families') },
      { id: 'sort', type: 'sort', label: 'Order', options: [{ value: '-mean_auc', label: 'Highest AUC first' }, { value: 'mean_auc', label: 'Lowest AUC first' }, { value: 'candidate', label: 'Name' }] },
    ],
    charts: [{ type: 'intervals', limit: 15, label: '{candidate}', est: 'mean_auc', lo: 'min_auc', hi: 'max_auc', ref: 0.5, min: 0.4, max: 1, refLabel: 'chance (0.50)', tip: '{enzyme}, {candidate} ({family}): AUC {mean_auc:4} over 15 outer folds, from {min_auc:4} to {max_auc:4}' }],
  },
  calibration: {
    title: 'Explore the calibration',
    lede: 'The methods that were tried for each enzyme, at the gate that a probability had to meet: an expected calibration error of at most 0.05 and a slope between 0.8 and 1.2.',
    noun: 'methods',
    count: { key: 'gate_met', value: 'yes', label: 'meet the gate' },
    source: 'data/structure_track/outputs/cyp3a4/logs/calibration.log',
    columns: [col('isoform', 'Enzyme'), col('method', 'Method'), col('ece', 'Expected calibration error', 4), col('brier', 'Brier score', 4), col('slope', 'Slope', 3), col('intercept', 'Intercept', 3), col('mean_pred', 'Mean predicted', 3), col('mean_obs', 'Mean observed', 3), col('gate_met', 'Gate met')],
    rows: calibration.rows,
    controls: [
      { id: 'isoform', type: 'filter', key: 'isoform', label: 'Enzyme', options: options(uniq(calibration.rows, 'isoform')) },
      { id: 'metric', type: 'view', label: 'Show', options: [{ value: 'ECE', label: 'Expected calibration error' }, { value: 'Brier', label: 'Brier score' }] },
    ],
    charts: [
      { when: { metric: 'ECE' }, type: 'bars', label: '{method}', value: 'ece', max: 0.4, ref: { value: 0.05, label: 'gate limit' }, tip: '{isoform}, {method}: ECE {ece:4}, Brier {brier:4}, slope {slope:3}, intercept {intercept:3}; mean predicted {mean_pred:3} against observed {mean_obs:3}; gate met: {gate_met}' },
      { when: { metric: 'Brier' }, type: 'bars', label: '{method}', value: 'brier', max: 0.25, tip: '{isoform}, {method}: Brier {brier:4}, ECE {ece:4}, slope {slope:3}; mean predicted {mean_pred:3} against observed {mean_obs:3}' },
    ],
  },

  'structure-entry': {
    position: 'after',
    title: 'Explore the 20 ligands',
    lede: 'The submitted pose of each ligand against the pose of the organisers\u2019 baseline or against the best pose of the pool of the project. The ligands are numbered 1 to 20 and carry no name.',
    noun: 'ligands',
    source: 'explorer/full/data/pd_ligands.csv (data/post_deadline/outputs/structure_submitted_per_compound.csv)',
    columns: [col('ligand', 'Ligand'), col('submitted_pli', 'LDDT-PLI, submitted', 3), col('baseline_pli', 'LDDT-PLI, baseline', 3), col('pool_best', 'Best pose of the pool', 3), col('pool_mean', 'Mean pose of the pool', 3), col('pool_poses', 'Poses in the pool')],
    rows: firstEntry.rows.map((r) => ({ ligand: r.ligand, submitted_pli: r.submitted_pli, baseline_pli: r.baseline_pli, pool_best: r.pool_best, pool_mean: r.pool_mean, pool_poses: r.pool_poses, gain_baseline: gap(r.submitted_pli, r.baseline_pli), gap_best: gap(r.pool_best, r.submitted_pli) })),
    controls: [
      { id: 'other', type: 'view', label: 'Compare with', options: [{ value: 'baseline', label: 'The organisers\u2019 baseline' }, { value: 'pool', label: 'The best pose of the pool' }] },
      { id: 'sort', type: 'sort', label: 'Order', options: [{ value: 'order', label: 'By ligand number' }, { value: '-gain_baseline', label: 'Gain over the baseline, largest first' }, { value: 'gain_baseline', label: 'Gain over the baseline, smallest first' }, { value: '-gap_best', label: 'Gap to the best pose, largest first' }] },
    ],
    charts: [
      { when: { other: 'baseline' }, type: 'pairs', label: 'Ligand {ligand}', a: 'submitted_pli', b: 'baseline_pli', aLabel: 'submitted pose', bLabel: 'organisers\u2019 baseline', min: 0, max: 1, tip: 'Ligand {ligand}: submitted {submitted_pli:3}, baseline {baseline_pli:3}; best of {pool_poses} poses of the pool {pool_best:3}' },
      { when: { other: 'pool' }, type: 'pairs', label: 'Ligand {ligand}', a: 'submitted_pli', b: 'pool_best', aLabel: 'submitted pose', bLabel: 'best pose of the pool', min: 0, max: 1, tip: 'Ligand {ligand}: submitted {submitted_pli:3}; best of {pool_poses} poses of the pool {pool_best:3}, mean {pool_mean:3}' },
    ],
  },

  'label-rule-agreement': {
    noun: 'enzymes',
    source: 'data/post_deadline/outputs/tdi_question2a_agreement.csv',
    columns: [col('isoform', 'Enzyme'), col('labelled', 'Labelled test compounds'), col('agree', 'Same label'), col('disagree', 'Different label'), col('not_computable', 'Rule not applicable')],
    rows: agreement.rows,
    controls: [],
    charts: [],
  },
  'iron-contact-structures': {
    title: 'Explore the four compounds',
    lede: 'Filter the compounds by whether the iron contact was found. The line is the cut-off of 2.6 \u00c5 for a dative bond.',
    noun: 'compounds',
    source: 'README.md, validation against crystal and cryo-EM structures (cypmode.validation.structures)',
    columns: [col('compound', 'Compound'), col('motif', 'Motif call'), col('distance', 'Closest motif-N distance (\u00c5)', 2), col('coordinated', 'Coordinated'), col('affinity', 'Affinity probability (Boltz-2)', 2), col('confidence', 'Confidence score', 2)],
    rows: [
      { compound: 'Ketoconazole', motif: 'Type II (imidazole)', distance: 2.05, coordinated: 'yes', affinity: 0.86, confidence: 0.92 },
      { compound: 'Ritonavir', motif: 'Type II (thiazole)', distance: 2.19, coordinated: 'yes', affinity: 0.4, confidence: 0.92 },
      { compound: 'Azamulin', motif: 'Type II (triazole)', distance: 13.41, coordinated: 'no', affinity: 0.73, confidence: 0.93 },
      { compound: 'Vardenafil', motif: 'Type II (imidazole_Nsub)', distance: 10.53, coordinated: 'no', affinity: 0.42, confidence: 0.93 },
    ],
    controls: [{ id: 'coordinated', type: 'filter', key: 'coordinated', label: 'Iron contact found', options: [{ value: '*', label: 'Both' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }],
    charts: [{ type: 'bars', label: '{compound}', value: 'distance', max: 15, ref: { value: 2.6, label: 'dative bond' }, tip: '{compound} ({motif}): iron\u2013nitrogen distance {distance:2} \u00c5, coordinated: {coordinated}; affinity probability {affinity:2}, confidence {confidence:2}' }],
  },

  'independent-contact-fingerprints': {
    noun: 'compounds',
    source: 'README.md, independent cross-check',
    columns: [col('compound', 'Compound'), col('fingerprint', 'Metal-acceptor contact (cyp-heatmap)'), col('distance', 'Closest motif-N distance (\u00c5), this project', 2), col('call', 'Call of this project'), col('agree', 'Same call')],
    rows: [
      { compound: 'Ketoconazole', fingerprint: 1, distance: 2.05, call: 'coordinated', agree: 'yes' },
      { compound: 'Ritonavir', fingerprint: 1, distance: 2.19, call: 'coordinated', agree: 'yes' },
      { compound: 'Azamulin', fingerprint: 0, distance: 13.41, call: 'not coordinated', agree: 'yes' },
      { compound: 'Vardenafil', fingerprint: 0, distance: 10.53, call: 'not coordinated', agree: 'yes' },
    ],
    controls: [],
    charts: [],
  },

  'octant-potency-check': {
    noun: 'groups',
    source: 'data/tdi_track/inputs/octant_cache/motif_potency_validation.json (as quoted in README.md)',
    columns: [col('group', 'Group'), col('n', 'Compounds'), col('mean', 'Mean pIC50', 2), col('median', 'Median pIC50', 2)],
    rows: [
      { group: 'Motif-positive', n: 450, mean: 5.32, median: 5.43 },
      { group: 'Motif-negative', n: 633, mean: 5.17, median: 5.3 },
    ],
    controls: [],
    charts: [],
  },

  'tdi-reference-panel': {
    title: 'Explore the six drugs',
    lede: 'Filter the drugs by whether the screen finds a Type II motif in them. The line is the twofold threshold.',
    noun: 'drugs',
    count: { key: 'positive', value: 'yes', label: 'time-dependent' },
    source: 'data/tdi_track/inputs/octant_cache/tdi_reference/tdi_pic50_shift.tsv and README.md',
    columns: [col('drug', 'Drug'), col('shift', 'Shift in pIC50', 2), col('positive', 'Time-dependent (more than twofold)'), col('motif', 'Type II motif found'), col('coordinated', 'Coordinated in the predicted complex')],
    rows: [
      { drug: 'Ketoconazole', shift: 0.03, positive: 'no', motif: 'yes', coordinated: 'yes, 2.05 \u00c5' },
      { drug: 'Clotrimazole', shift: 0.17, positive: 'no', motif: 'yes', coordinated: 'not run' },
      { drug: 'Diltiazem', shift: 0.35, positive: 'yes', motif: 'no', coordinated: 'not run' },
      { drug: 'Verapamil', shift: 0.84, positive: 'yes', motif: 'no', coordinated: 'not run' },
      { drug: 'Azamulin', shift: 0.99, positive: 'yes', motif: 'yes', coordinated: 'no, 13.41 \u00c5' },
      { drug: 'Troleandomycin', shift: 1.25, positive: 'yes', motif: 'no', coordinated: 'not run' },
    ],
    controls: [
      { id: 'motif', type: 'filter', key: 'motif', label: 'Type II motif found', options: [{ value: '*', label: 'Either' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
      { id: 'sort', type: 'sort', label: 'Order', options: [{ value: 'order', label: 'By shift' }, { value: '-shift', label: 'Largest shift first' }] },
    ],
    charts: [{ type: 'bars', label: '{drug}', value: 'shift', max: 1.5, ref: { value: 0.301, label: 'twofold' }, tip: '{drug}: shift {shift:2} in pIC50; time-dependent: {positive}; Type II motif: {motif}; coordinated: {coordinated}' }],
  },
  'applicability-domain': {
    title: 'Explore the bins',
    lede: 'Choose an enzyme and a confidence cut. A bin is supported only when the lower end of its interval reaches 0.60.',
    noun: 'bins',
    source: 'data/structure_track/outputs/cyp3a4/logs/applicability_domain.log',
    columns: [col('enzyme', 'Enzyme'), col('cut', 'Confidence cut'), col('bin', 'Similarity bin'), col('held_out', 'Held-out compounds'), col('positive_share', 'Positive share', 2), col('auc', 'AUC', 3), col('lo', 'Interval, low', 3), col('hi', 'Interval, high', 3), col('tier', 'Tier'), col('blinded', 'Blinded compounds')],
    rows: applicability.rows,
    controls: [
      { id: 'enzyme', type: 'filter', key: 'enzyme', label: 'Enzyme', options: options(uniq(applicability.rows, 'enzyme'), 'Both enzymes'), value: 'CYP3A4' },
      { id: 'cut', type: 'filter', key: 'cut', label: 'Confidence cut', options: options(uniq(applicability.rows, 'cut')) },
      { id: 'sort', type: 'sort', label: 'Order', options: [{ value: 'order', label: 'By similarity' }, { value: '-auc', label: 'Highest AUC first' }, { value: 'auc', label: 'Lowest AUC first' }] },
    ],
    charts: [
      {
        type: 'intervals',
        label: '{enzyme}, {bin}',
        est: 'auc',
        lo: 'lo',
        hi: 'hi',
        ref: 0.6,
        min: 0.4,
        max: 1,
        refLabel: 'bar for the lower end (0.60)',
        tip: '{enzyme}, similarity {bin}, {cut}: AUC {auc:3} ({lo:3} to {hi:3}); {held_out} held-out compounds; {blinded} blinded compounds; tier {tier}',
      },
    ],
  },

  'test-like-holdout': {
    title: 'Explore the candidates',
    lede: 'Each candidate is shown with its cross-validated AUC and its AUC on the held-out block. The line is the 95% interval on the block.',
    noun: 'candidates',
    source: 'data/structure_track/outputs/cyp3a4/logs/block_holdout.log',
    columns: [col('candidate', 'Candidate'), col('family', 'Family'), col('cv_auc', 'Cross-validated AUC', 4), col('block_auc', 'Block AUC', 4), col('lo', 'Interval, low', 4), col('hi', 'Interval, high', 4), col('block_ap', 'Average precision', 4), col('block_mcc', 'MCC at the block prevalence', 4)],
    rows: holdout.rows,
    controls: [
      { id: 'family', type: 'filter', key: 'family', label: 'Family', options: options(uniq(holdout.rows, 'family'), 'All families') },
      { id: 'sort', type: 'sort', label: 'Order', options: [{ value: '-cv_auc', label: 'Cross-validated AUC, highest first' }, { value: '-block_auc', label: 'Block AUC, highest first' }, { value: 'candidate', label: 'Name' }] },
    ],
    charts: [{ type: 'pairs', label: '{candidate}', a: 'cv_auc', b: 'block_auc', lo: 'lo', hi: 'hi', aLabel: 'cross-validated AUC', bLabel: 'AUC on the held-out block', min: 0.5, max: 1, tip: '{candidate}: cross-validated AUC {cv_auc:3}; block AUC {block_auc:3} ({lo:3} to {hi:3}); average precision {block_ap:3}; MCC at the block prevalence {block_mcc:3}' }],
  },

  'ligand-dynamics': {
    title: 'Explore the ligands',
    lede: 'The rank correlation of a score with minus the RMSD to the crystal pose, for the poses of each benchmark ligand. The gate needed a mean above +0.3 and a positive value for at least 60% of the ligands.',
    noun: 'values',
    source: 'data/structure_track/outputs/cyp3a4/logs/ligand_dynamics.log',
    columns: [col('ligand', 'Ligand (PDB code)'), col('score', 'Score'), col('poses', 'Poses'), col('rho', 'Rank correlation', 3)],
    rows: dynamics.rows.map((r) => ({ ...r, score: SCORES[r.score] })),
    mean: { key: 'rho', label: 'rank correlation' },
    controls: [
      { id: 'score', type: 'filter', key: 'score', label: 'Score', options: options(Object.values(SCORES)) },
      { id: 'sort', type: 'sort', label: 'Order', options: [{ value: 'order', label: 'By ligand' }, { value: '-rho', label: 'Highest first' }, { value: 'rho', label: 'Lowest first' }] },
    ],
    charts: [{ type: 'diverging', span: 1, ref: { value: 0.3, label: 'bar for the mean' }, label: '{ligand}, {poses} poses', value: 'rho', tip: 'Ligand {ligand}, {score}: rank correlation {rho:3} over {poses} poses' }],
  },

  'gate-ledger': {
    title: 'Explore the 187 verdicts',
    lede: 'One square for each verdict of the ledger. Point at a square for its name; filter by family of ideas or by verdict.',
    noun: 'verdicts',
    count: { key: 'verdict', value: 'MET', label: 'met' },
    source: 'explorer/public/ledger.csv',
    columns: [col('verdict', 'Verdict'), col('kind', 'Family of ideas'), col('name', 'Verdict as registered'), col('log', 'Log')],
    rows: ledger.rows,
    controls: [
      { id: 'kind', type: 'filter', key: 'kind', label: 'Family of ideas', options: options(uniq(ledger.rows, 'kind'), 'All families') },
      { id: 'verdict', type: 'filter', key: 'verdict', label: 'Verdict', options: [{ value: '*', label: 'Met and not met' }, { value: 'MET', label: 'Met' }, { value: 'NOT MET', label: 'Not met' }] },
    ],
    charts: [{ type: 'gates', flag: 'verdict', flagValue: 'MET', tip: '{verdict}: {name} ({kind})' }],
  },

  'structure-levers': {
    title: 'Explore the 39 verdicts',
    lede: 'The verdicts on the ways to improve the predicted structures. Point at a square for its name.',
    noun: 'verdicts',
    count: { key: 'verdict', value: 'MET', label: 'met' },
    source: 'explorer/public/ledger.csv',
    columns: [col('verdict', 'Verdict'), col('name', 'Verdict as registered'), col('log', 'Log')],
    rows: ledger.rows.filter((r) => r.kind === 'structure levers'),
    controls: [
      { id: 'verdict', type: 'filter', key: 'verdict', label: 'Verdict', options: [{ value: '*', label: 'Met and not met' }, { value: 'MET', label: 'Met' }, { value: 'NOT MET', label: 'Not met' }] },
      { id: 'sort', type: 'sort', label: 'Order', options: [{ value: 'order', label: 'Order of the ledger' }, { value: 'name', label: 'Name' }, { value: 'log', label: 'Log' }] },
    ],
    charts: [{ type: 'gates', flag: 'verdict', flagValue: 'MET', tip: '{verdict}: {name} (log {log})' }],
  },

  'first-entry-comparison': {
    title: 'Explore the 20 ligands',
    lede: 'The ligands are numbered 1 to 20 and carry no name. Choose a metric and the poses to compare with, and order the ligands by the difference.',
    noun: 'ligands',
    source: 'explorer/full/data/pd_ligands.csv',
    columns: [
      col('ligand', 'Ligand'),
      col('external_pli', 'LDDT-PLI, first-ranked', 3), col('submitted_pli', 'LDDT-PLI, submitted', 3), col('baseline_pli', 'LDDT-PLI, baseline', 3),
      col('external_bisy', 'BiSyRMSD, first-ranked (Å)', 2), col('submitted_bisy', 'BiSyRMSD, submitted (Å)', 2), col('baseline_bisy', 'BiSyRMSD, baseline (Å)', 2),
      col('external_lp', 'LDDT-LP, first-ranked', 3), col('submitted_lp', 'LDDT-LP, submitted', 3), col('baseline_lp', 'LDDT-LP, baseline', 3),
      col('pool_best', 'Best pose of the pool (LDDT-PLI)', 3), col('pool_poses', 'Poses in the pool'),
    ],
    rows: entries,
    controls: [
      { id: 'metric', type: 'view', label: 'Metric', options: [{ value: 'LDDT-PLI', label: 'LDDT-PLI (higher is better)' }, { value: 'BiSyRMSD', label: 'BiSyRMSD in Å (lower is better)' }, { value: 'LDDT-LP', label: 'LDDT-LP (higher is better)' }] },
      { id: 'other', type: 'view', label: 'Compare with', options: [{ value: 'submitted', label: 'The submitted poses' }, { value: 'baseline', label: 'The organisers’ baseline' }] },
      {
        id: 'sort',
        type: 'sort',
        label: 'Order',
        options: [
          { value: 'order', label: 'By ligand number' },
          { value: '-d_pli_sub', label: 'LDDT-PLI gain over the submitted poses, largest first' },
          { value: '-d_pli_base', label: 'LDDT-PLI gain over the baseline, largest first' },
          { value: '-d_bisy_sub', label: 'BiSyRMSD gain over the submitted poses, largest first' },
          { value: '-d_bisy_base', label: 'BiSyRMSD gain over the baseline, largest first' },
          { value: '-d_lp_sub', label: 'LDDT-LP gain over the submitted poses, largest first' },
          { value: '-d_lp_base', label: 'LDDT-LP gain over the baseline, largest first' },
        ],
      },
    ],
    charts: [
      pairsFirst('LDDT-PLI', 'submitted', 0, 1),
      pairsFirst('LDDT-PLI', 'baseline', 0, 1),
      pairsFirst('BiSyRMSD', 'submitted', 0, 8),
      pairsFirst('BiSyRMSD', 'baseline', 0, 20),
      pairsFirst('LDDT-LP', 'submitted', 0.4, 1),
      pairsFirst('LDDT-LP', 'baseline', 0, 1),
    ],
  },

  'threshold-ceiling': {
    title: 'Explore the thresholds',
    lede: 'The MCC on the released test labels for every share of compounds that is called positive, from the stored scores. The mark at the top is the best threshold; the other is the file that was submitted.',
    noun: 'points',
    source: 'explorer/full/data/pd_threshold.csv',
    columns: [col('enzyme', 'Enzyme'), col('kind', 'Point'), col('call_rate', 'Share called positive', 4), col('mcc', 'MCC', 4)],
    rows: threshold.rows,
    controls: [{ id: 'enzyme', type: 'filter', key: 'enzyme', label: 'Enzyme', options: options(uniq(threshold.rows, 'enzyme')) }],
    charts: ['CYP3A4', 'CYP2D6'].map((enzyme) => ({
      when: { enzyme },
      type: 'curve',
      x: 'call_rate',
      y: 'mcc',
      curveWhere: { kind: 'curve' },
      xLabel: 'share of compounds called positive',
      yLabel: 'MCC',
      xmin: 0,
      xmax: 0.6,
      ymin: 0,
      ymax: enzyme === 'CYP3A4' ? 0.6 : 0.4,
      marks: [
        { where: { kind: 'submitted calls' }, label: 'submitted {mcc:3}', tip: 'Submitted calls: share {call_rate:3}, MCC {mcc:3}' },
        { where: { kind: 'best threshold' }, label: 'best threshold {mcc:3}', tip: 'Best threshold chosen with the labels: share {call_rate:3}, MCC {mcc:3}' },
      ],
    })),
  },

  'relaxation-gate': {
    position: 'after',
    title: 'Explore the poses',
    lede: 'How far the ligand moved in the relaxation, for 90 poses of 30 ligands with public crystal poses. The rule allows at most 1.0 Å. Each bar is the largest movement among the poses of a ligand.',
    noun: 'poses',
    source: 'data/structure_track/outputs/cyp3a4/logs/relaxation_gate.log',
    columns: [col('group', 'Set of ligands'), col('ligand', 'Ligand (PDB code)'), col('pose', 'Pose'), col('energy_before', 'Energy before (kJ/mol)'), col('energy_after', 'Energy after (kJ/mol)'), col('moved', 'Ligand moved (Å)', 2)],
    rows: relaxation.rows,
    controls: [
      { id: 'group', type: 'filter', key: 'group', label: 'Set of ligands', options: [{ value: '*', label: 'All 30 ligands' }, { value: 'benchmark', label: 'The 10 of the benchmark' }, { value: 'expansion', label: 'The 20 of the expansion' }] },
      { id: 'sort', type: 'sort', label: 'Order', options: [{ value: 'order', label: 'Order of the log' }, { value: '-moved', label: 'Largest movement first' }, { value: '-energy_before', label: 'Highest energy before first' }] },
    ],
    charts: [{ type: 'bars', groupBy: 'ligand', agg: 'max', label: '{key}', value: 'moved', max: 1, ref: { value: 1, label: 'limit of the rule' }, tip: 'Ligand {key}: the largest movement is {value} Å over {n} poses' }],
  },

  'data-integrity': {
    title: 'Explore the checks',
    lede: 'One square for each of the 17 checks. Point at a square for its name.',
    noun: 'checks',
    count: { key: 'status', value: 'passed', label: 'passed' },
    source: 'METHOD_REPORT.md, section 2',
    columns: [col('group', 'Group'), col('check', 'Check'), col('result', 'Result'), col('status', 'Status')],
    rows: integrity.rows,
    controls: [{ id: 'group', type: 'filter', key: 'group', label: 'Group', options: options(uniq(integrity.rows, 'group'), 'All checks') }],
    charts: [{ type: 'gates', flag: 'status', flagValue: 'passed', tip: '{group}: {check} ({result}), {status}' }],
  },

  'board-reproduction': {
    title: 'Explore the scores',
    lede: 'The score of the project against the value on the final board. The axis is narrow, so a difference that the picture cannot show is in the table.',
    noun: 'scores',
    source: 'explorer/full/data/pd_gate.csv',
    columns: [col('track', 'Track'), col('entry', 'Entry'), col('metric', 'Metric'), col('scored', 'Scored by the project', 5), col('board', 'Final board', 5), col('difference', 'Difference', 5)],
    rows: board.rows.map((r) => ({ ...r, difference: Number((r.scored - r.board).toFixed(6)) })),
    controls: [{ id: 'metric', type: 'filter', key: 'metric', label: 'Metric', options: options(uniq(board.rows, 'metric')) }],
    charts: [
      { when: { metric: 'macro MCC' }, type: 'pairs', label: '{entry}', a: 'scored', b: 'board', aLabel: 'scored by the project', bLabel: 'value on the final board', min: 0.3722, max: 0.3726, tip: '{entry}, {metric}: scored {scored:6}, board {board:6}, difference {difference:6}' },
      { when: { metric: 'LDDT-PLI' }, type: 'pairs', label: '{entry}', a: 'scored', b: 'board', aLabel: 'scored by the project', bLabel: 'value on the final board', min: 0.4, max: 0.5, tip: '{entry}, {metric}: scored {scored:6}, board {board:6}, difference {difference:6}' },
      { when: { metric: 'BiSyRMSD' }, type: 'pairs', label: '{entry}', a: 'scored', b: 'board', aLabel: 'scored by the project', bLabel: 'value on the final board', min: 3.4, max: 4.1, tip: '{entry}, {metric} in Å: scored {scored:6}, board {board:6}, difference {difference:6}' },
    ],
  },

  'final-stack-additions': {
    position: 'after',
    title: 'Explore the stacks',
    lede: 'The default stack against each stack with an added group, at the two confidence cuts. The p-values are those of the registered paired test, before the Holm correction over the 52 comparisons of the batch.',
    noun: 'stacks',
    source: 'METHOD_REPORT.md, section 6',
    columns: [col('stack', 'Stack'), col('candidates', 'Candidates'), col('cut', 'Confidence cut'), col('auc', 'AUC', 4), col('mcc', 'MCC', 4), col('difference', 'Gain in AUC', 4), col('p', 'p', 4)],
    rows: stackRows,
    controls: [{ id: 'cut', type: 'filter', key: 'cut', label: 'Confidence cut', options: options(['z0 = 1.96', 'z0 = 1.0']) }],
    charts: [
      { when: { cut: 'z0 = 1.96' }, type: 'pairs', label: '{stack}', a: 'default_auc', b: 'auc', aLabel: 'default stack', bLabel: 'this stack', min: 0.83, max: 0.87, tip: '{stack} ({candidates} candidates), {cut}: AUC {auc:4}, MCC {mcc:4}; gain {difference:4}, p {p:4}' },
      { when: { cut: 'z0 = 1.0' }, type: 'pairs', label: '{stack}', a: 'default_auc', b: 'auc', aLabel: 'default stack', bLabel: 'this stack', min: 0.8, max: 0.84, tip: '{stack} ({candidates} candidates), {cut}: AUC {auc:4}, MCC {mcc:4}; gain {difference:4}, p {p:4}' },
    ],
  },
};
