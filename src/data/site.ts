// Content for IC50's Lab. Every item here can be checked against a file or a public page.

export const person = {
  name: 'Muhammad Talaat',
  lab: "IC50’s Lab",
  // The specialty shown under the name on the home page, the profile and in search snippets.
  tagline: 'Computational Pharmaceutics, Cheminformatics, ML',
  // Shown beside the pin icon. Change this one line when you move or travel.
  location: 'Cairo, Egypt',
  email: 'mohamed.talaat@pharma.asu.edu.eg',
};

export const links = {
  github: 'https://github.com/mohamedtalaat-gif',
  orcid: 'https://orcid.org/0000-0002-9171-437X',
  linkedin: 'https://www.linkedin.com/in/muhammad-talaat-4582b6129',
  scholar: 'https://scholar.google.com/citations?user=NCqIwbsAAAAJ&hl=en',
  researchgate: 'https://www.researchgate.net/profile/Muhammed_Talaat',
  cypmodeDoi: 'https://doi.org/10.5281/zenodo.23816450',
};

// The one order of the profile links, used by the home dock, the profile card and every list of links on the site:
// contact first, then the research identities (publications, persistent identifier, papers), then code, then the professional profile.
export const profiles = [
  { icon: 'mail', label: 'Email', href: `mailto:${person.email}` },
  { icon: 'scholar', label: 'Google Scholar', href: links.scholar },
  { icon: 'orcid', label: 'ORCID', href: links.orcid },
  { icon: 'researchgate', label: 'ResearchGate', href: links.researchgate },
  { icon: 'github', label: 'GitHub', href: links.github },
  { icon: 'linkedin', label: 'LinkedIn', href: links.linkedin },
] as const;

export const nav = [
  { href: '/news/', label: 'News' },
  { href: '/blog/', label: 'Blog' },
  { href: '/publications/', label: 'Publications' },
  { href: '/activities/', label: 'Activities' },
  { href: '/dev/', label: 'Dev' },
  {
    label: 'Lab',
    children: [
      { href: '/visualization/', label: 'Visualisation experiments' },
      { href: '/validation/', label: 'Model validation' },
      { href: '/wet-lab/', label: 'Wet lab' },
    ],
  },
  { href: '/profile/', label: 'Profile' },
];

export interface Entry {
  date: string; // ISO or year
  title: string;
  text: string;
  href?: string;
  kind: 'result' | 'release' | 'course' | 'paper' | 'award';
}

export const activities: Entry[] = [
  {
    date: '2026-11-05',
    kind: 'result',
    title: 'OpenADMET CYP Inhibition Blind Challenge: final boards',
    text: 'CYPMode placed 14th of 62 on time-dependent inhibition (macro MCC 0.372) and 15th of 38 on CYP3A4 structure prediction. The structure entry cannot be told apart from the published Boltz-2 baseline (LDDT-PLI 0.413 against 0.420).',
    href: 'https://github.com/mohamedtalaat-gif/CYPMode',
  },
  {
    date: '2026-11-05',
    kind: 'release',
    title: 'CYPMode 0.3.1 archived',
    text: 'The code, method report, audit, and the analysis against the released labels are archived on Zenodo with a DOI, and on Software Heritage.',
    href: links.cypmodeDoi,
  },
  {
    date: '2026-11-03',
    kind: 'course',
    title: 'Agentic AI in Healthcare, Stanford Medicine Data Ocean',
    text: 'Forty-hour online certificate from the Department of Genetics.',
  },
  {
    date: '2026-10',
    kind: 'release',
    title: 'Stepan surfactant dry lab',
    text: 'An independent computational notebook rebuilt from a personal-care seminar: 40 charts as data, 34 formulas with calculators, 27 structures in 3D, and coarse-grained molecular dynamics of micelle and bilayer assembly.',
    href: 'https://github.com/mohamedtalaat-gif/Stepan_Surfactant_Cheminformatics',
  },
  {
    date: '2026-09',
    kind: 'release',
    title: 'CYPMode begins, and PharmAMP is released',
    text: 'CYPMode starts as a heme-coordination screen of TDC inhibition labels. PharmAMP scores aggregation propensity and solubility for AI-designed antimicrobial peptides.',
    href: 'https://github.com/mohamedtalaat-gif/PharmAMP',
  },
  {
    date: '2025-10-29',
    kind: 'paper',
    title: 'Nano-antioxidants for neurodegenerative disorders: a scoping review',
    text: 'Published in Discover Nano. First author.',
    href: 'https://doi.org/10.1186/s11671-025-04320-9',
  },
  {
    date: '2025-03-17',
    kind: 'course',
    title: 'Fundamentals of Data Science in Precision Medicine and Cloud Computing',
    text: 'Forty-hour online certificate, Stanford Medicine Data Ocean.',
  },
  {
    date: '2024-10-07',
    kind: 'paper',
    title: 'Biologically synthesized nanoparticles',
    text: 'Sole-author paper in Discover Nano on barley-mediated silver and gold nanoparticles and a caged gold nanoplatform for drug delivery.',
    href: 'https://doi.org/10.1186/s11671-024-04097-3',
  },
  {
    date: '2019',
    kind: 'award',
    title: 'Best Formulation Award',
    text: 'Best Formulation Award at the 6th Volatile Oil Gallery, Faculty of Pharmacy, Ain Shams University, for a topical formula for eczema and burns based on a natural active ingredient.',
  },
];

// The Activities page lists the lasting record: papers, awards and events attended. Dated updates (News) come from the blog posts.
export const record = activities.filter((a) => ['paper', 'award'].includes(a.kind));

// Conferences and seminars attended.
export const conferences = [
  { date: '2024-01-19', place: 'Cairo, Egypt', title: 'BGICC: Breast Gynecological International Cancer Conference, 16th edition', text: 'Pfizer “Meet the Experts” breast workshop; “Creation and Innovation” session.' },
  { date: '2024', place: 'Badr, Egypt', title: 'BUCPS: Badr University Conference of Pharmaceutical Sciences', text: 'Session: Machine Learning Methods in Drug Delivery: Novel Pharmaceutics Informatics Approach.' },
];

export const courses = [
  { year: 2026, title: 'Agentic AI in Healthcare', by: 'Stanford Medicine Data Ocean, Department of Genetics. 40 hours.', href: 'https://dataocean.stanford.edu/verify-certificate/84c8fb8e62134aa5a10d01a498953039?sig=1.ZD7_mhdA96pPh7fkZ66gnFFK0TFPHf9XCGh3IyDaDoA' },
  { year: 2025, title: 'Fundamentals of Data Science in Precision Medicine and Cloud Computing', by: 'Stanford Medicine Data Ocean, Department of Genetics. 40 hours.', href: 'https://dataocean.stanford.edu/verify-certificate/cb808dd260f6451e80f17b8b32daea9e?sig=1.vB7MNz-xRsd0Kp6l6wtvnOTWZ429fjub2RAL348svOE' },
  { year: 2020, title: 'How to Write and Publish a Scientific Paper', by: 'École Polytechnique, Coursera', href: 'https://coursera.org/verify/LJLKV3247AHF' },
  { year: 2020, title: 'Programming for Everybody (Getting Started with Python)', by: 'University of Michigan, Coursera', href: 'https://coursera.org/verify/FV9WGQLN858S' },
  { year: 2020, title: 'Introduction to Genomic Technologies', by: 'Johns Hopkins University, Coursera', href: 'https://coursera.org/verify/UYJPU6NCUGNY' },
  { year: 2020, title: 'Genomic Data Science with Galaxy', by: 'Johns Hopkins University, Coursera', href: 'https://coursera.org/verify/W6JV5VHFA4ED' },
  { year: 2020, title: 'Mindshift: Break Through Obstacles to Learning', by: 'McMaster University, Coursera (with honours)', href: 'https://coursera.org/verify/YJETCZXFAXJ5' },
  { year: 2020, title: 'Introduction to Pharmacovigilance', by: 'Uppsala Monitoring Centre' },
  { year: 2017, title: 'Medicinal Chemistry Research Internship Program (MCRI)', by: 'Department of Pharmaceutical Chemistry, Faculty of Pharmacy, Ain Shams University. 26 January to 5 February and 1 July to 16 September 2017.' },
];

export const repos = [
  {
    name: 'CYPMode',
    href: 'https://github.com/mohamedtalaat-gif/CYPMode',
    license: 'AGPL-3.0-or-later',
    text: 'Time-dependent CYP3A4 and CYP2D6 inhibition and CYP3A4 co-folded structures for the OpenADMET challenge. Nested cross-validation on the scored population, 187 pre-registered gates, a public ledger of the 178 that failed, and an audit that regenerates every reported number.',
    tags: ['cheminformatics', 'ADMET', 'Boltz-2', 'GFN2-xTB'],
  },
  {
    name: 'CEREBRO-X',
    href: 'https://github.com/mohamedtalaat-gif/CEREBRO-X',
    license: 'MIT',
    text: 'A pipeline that scores candidate delivery systems for central nervous system (CNS) drugs on a 62-criterion rubric that uses physiologically based pharmacokinetic (PBPK) models, DLVO colloidal stability, and ChEMBL-trained QSAR (quantitative structure–activity relationship) models. Released as a research prototype with a public audit of its own bugs.',
    tags: ['drug delivery', 'PBPK', 'QSAR'],
  },
  {
    name: 'PharmAMP',
    href: 'https://github.com/mohamedtalaat-gif/PharmAMP',
    license: 'MIT',
    text: 'Aggregation-propensity and solubility metrics for AI-designed antimicrobial peptides, compatible with seqme and checked against published cytotoxicity data for 217 peptides.',
    tags: ['peptides', 'developability'],
  },
  {
    name: 'Stepan Surfactant Cheminformatics',
    href: 'https://github.com/mohamedtalaat-gif/Stepan_Surfactant_Cheminformatics',
    license: 'MIT',
    text: 'Surfactants and conditioning actives of a personal-care seminar as structures, physical chemistry, and coarse-grained molecular dynamics, built in marimo with RDKit and OpenMM. The seminar decks belong to Stepan and are not redistributed.',
    tags: ['formulation', 'molecular dynamics', 'marimo'],
  },
];

export const education = [
  { when: '2021', title: 'BPharm, Pharmaceutical Sciences', where: 'Faculty of Pharmacy, Ain Shams University, Cairo' },
  { when: '2021', title: 'Certified Pharmacist', where: 'Egyptian Pharmacists Syndicate' },
  { when: '2017', title: 'Medicinal Chemistry Research Internship (MCRI)', where: 'Pharmaceutical Chemistry Department, Ain Shams University' },
];

export const employment = [
  { when: 'Dec 2024 to now', title: 'R&D Supervisor and Project Lead', where: 'Label Rock, private-label pharmaceutical and cosmetic manufacturing, Cairo', text: 'Formulation development for private-label clients across solid, liquid, semi-solid, and parenteral dosage forms; leads the R&D team; prepares master batch records, CTD sections, and Ministry of Health registration files.' },
  { when: '2024 to now', title: 'Oncology and chemotherapy preparation pharmacist', where: 'El Demerdash Hospital, Ain Shams University', text: 'Aseptic chemotherapy preparation, cytotoxic inventory, sterility compliance, and counselling with oncology and nursing teams.' },
  { when: 'Jul 2023 to Jul 2024', title: 'R&D researcher', where: 'BRAND for Pharmaceutical Industries, Giza', text: 'Formulation trials under good laboratory practice, stability studies, scale-up transfers, and Ministry of Health registration files.' },
  { when: '2021 to 2023', title: 'Emergency and clinical pharmacist, mandatory service', where: 'Egyptian Military Medical Unit, 3rd Field Army Headquarters, Suez', text: '' },
  { when: '2017 to 2021', title: 'Undergraduate research assistant and formulation projects', where: 'Faculty of Pharmacy, Ain Shams University', text: 'Best Formulation Award (2019) and lung-targeted rifampicin microparticles (2020).' },
];

export const languages = 'Arabic (native), English (C1), German (B1), Turkish (A2)';

// Client brands for the wet-lab page, in the order given by the author.
// `company` is shown when the brand is a product line of a company. A link is added only where the owner has a site.
export interface Brand { name: string; href?: string; company?: string; companyHref?: string }
export const brands: Brand[] = [
  { company: 'Aptecure', name: 'Novique®', href: 'https://www.nouvique.com/' },
  { name: 'Alejon®', href: 'https://alejon.com/' },
  { company: 'Elixir Pharma', companyHref: 'https://elixirpharma-eg.com/', name: 'Potions®', href: 'https://potionsco.com/' },
  { company: 'Trust Pharma', name: 'Fresh Kiddo®', href: 'https://freshkiddo.com/' },
  { name: 'Healthy Elite Pharma®' },
  { name: 'Rio Pharma®' },
  { name: 'Proven Lab®', href: 'https://proven-labs.co/' },
  { name: 'Nebula®', href: 'https://nebula-eg.com/' },
  { name: 'DEOC®', href: 'https://deoc.store/' },
  { name: 'Feel Good Canada®', href: 'https://www.feelgood-ca.com/' },
  { name: 'SOIN®', href: 'https://soincosmetics.com/' },
  { name: 'Birdwing®', href: 'https://birdwing-hna.com/' },
  { company: 'Dermaera', name: 'Private Love®', href: 'https://privatelove.co/' },
  { name: 'Natura®', href: 'https://natura-co.com/' },
  { name: 'JEVAN®' },
  { name: 'YasPurpi®', href: 'https://purbicosmetics.com/shop/' },
  { name: 'Yesil®', href: 'https://yesilcosmetics.com/' },
];
