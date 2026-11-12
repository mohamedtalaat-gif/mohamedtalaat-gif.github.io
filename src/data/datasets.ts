// The data behind the validation reports. A dataset that a report tests against carries the name that the report uses in its `datasets` list, so that the page of the collection can link the two.
// Every size and licence is quoted from the repository or the page named in `source`; a licence that the sources do not state is left out and not guessed.

export interface Dataset {
  name: string;
  what: string;
  role: string;
  size?: string;
  licence?: string;
  source: { label: string; href: string };
}

const CYP = 'https://github.com/mohamedtalaat-gif/CYPMode';

export const datasets: Dataset[] = [
  {
    name: 'OpenADMET CYP inhibition challenge data',
    what: 'The training file and the blinded test file of the OpenADMET CYP inhibition blind challenge, with the labels that the organisers released after the deadline.',
    role: 'Training, nested validation, and the blinded test',
    size: '6,145 training rows, 750 test compounds',
    licence: 'Apache-2.0 (the card of the dataset)',
    source: { label: 'openadmet/cyp-challenge-train-test', href: 'https://huggingface.co/datasets/openadmet/cyp-challenge-train-test' },
  },
  {
    name: 'OpenADMET released CYP3A4 structures',
    what: 'The crystal structures of the 20 ligands of the structure track, released by the organisers after the deadline.',
    role: 'Scoring of the submitted poses and of the poses of other entries',
    size: '20 ligands',
    source: { label: 'OpenADMET CYP challenge', href: 'https://huggingface.co/spaces/openadmet/cyp-challenge' },
  },
  {
    name: 'Crystal structures of CYP3A4 ligands (Protein Data Bank)',
    what: 'The CYP3A4 ligands with a public crystal pose, from which the benchmark of the structure gates and the ligands of the relaxation gate were picked by a rule fixed in advance.',
    role: 'Benchmark for the gates of the structure track',
    size: '101 distinct ligands, 74 of which pass the rule; 10 in the benchmark and 30 in the relaxation gate',
    licence: 'Terms of the Protein Data Bank',
    source: { label: 'Protein Data Bank', href: 'https://www.rcsb.org' },
  },
  {
    name: 'Cryo-EM structures of four CYP3A4 complexes',
    what: 'The four compounds (ketoconazole, ritonavir, azamulin, and vardenafil) for which a recent cryo-EM study solved structures of the complex with CYP3A4.',
    role: 'Check of the iron-contact screen',
    size: '4 compounds',
    source: { label: 'CYPMode README', href: `${CYP}#validation-against-crystal-and-cryo-em-structures` },
  },
  {
    name: 'Contact fingerprints of 122 CYP3A4 structures (cyp-heatmap)',
    what: 'The interaction fingerprints that the cyp-heatmap pipeline of Pat Walters computes with ProLIF for experimental and modelled CYP3A4 structures.',
    role: 'Independent check of the binary call for the iron contact',
    size: '122 structures',
    source: { label: 'PatWalters/cyp-heatmap', href: 'https://github.com/PatWalters/cyp-heatmap' },
  },
  {
    name: 'OpenADMET Octant CYP inhibition and reactivity release',
    what: 'A diversity-library CYP3A4 dose–response screen with a 30-minute pre-incubation with the active enzyme.',
    role: 'Independent check of the link between the Type II motif and potency',
    size: 'about 1,200 compounds; 1,083 of 1,340 records pass the quality control of the fit',
    licence: 'CC BY 4.0',
    source: { label: 'OpenADMET/Octant_CYP_inhibition_reactivity_blog_release', href: 'https://huggingface.co/datasets/openadmet/Octant_CYP_inhibition_reactivity_blog_release' },
  },
  {
    name: 'OpenADMET Octant panel of six drugs with time-dependent shifts',
    what: 'Six named drugs with the measured difference between the pIC50 after a pre-incubation and the pIC50 without it.',
    role: 'Reference panel for time-dependent inhibition',
    size: '6 drugs',
    licence: 'CC BY 4.0',
    source: { label: 'OpenADMET/Octant_CYP_blog_post', href: 'https://github.com/OpenADMET/Octant_CYP_blog_post' },
  },
  {
    name: 'TDC / Veith CYP panel',
    what: 'The CYP panel of Veith and colleagues (Nature Biotechnology, 2009) as served by the Therapeutics Data Commons.',
    role: 'Training of a label-free block on compounds that are not challenge compounds',
    size: '16,061 connectivity keys, all of them also in PubChem assay 1851',
    licence: 'CC BY 4.0 (the page of the Therapeutics Data Commons)',
    source: { label: 'Therapeutics Data Commons', href: 'https://tdcommons.ai' },
  },
  {
    name: 'PubChem assay 1851',
    what: 'The PubChem deposit of the CYP panel of Veith and colleagues, the source of the panel that the Therapeutics Data Commons serves.',
    role: 'Check of the provenance of the TDC panel',
    size: 'every connectivity key of the TDC panel is in it (100%)',
    licence: 'NCBI policy: no restriction on the use or distribution of its molecular data, and a depositor may still claim rights',
    source: { label: 'PubChem assay 1851', href: 'https://pubchem.ncbi.nlm.nih.gov/bioassay/1851' },
  },
  {
    name: 'BBBP (MoleculeNet), 2,039 compounds',
    what: 'The blood–brain barrier penetration set of MoleculeNet.',
    role: 'Scaffold split against random split for CEREBRO-X',
    size: '2,039 compounds',
    source: { label: 'MoleculeNet', href: 'https://moleculenet.org' },
  },
  {
    name: 'Measured safety data for 217 designed antimicrobial peptides',
    what: 'Cytotoxicity, hemolysis, and secondary-structure measurements of designed antimicrobial peptides.',
    role: 'Independent test of the developability metrics of PharmAMP',
    size: '217 peptides',
    source: { label: 'PharmAMP README', href: 'https://github.com/mohamedtalaat-gif/PharmAMP#readme' },
  },
];
