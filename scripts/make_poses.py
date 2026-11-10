"""Build the pose-viewer data: for each of the 20 CYP3A4 structure-track ligands, the released
structure's pocket, heme and ligand, plus the submitted ligand superposed on the protein
C-alpha atoms. Inputs are the organisers' released structures and the submitted poses of the
CYPMode project; outputs go to public/data/poses."""
import csv, json, math, os
import numpy as np

# Folder with the CYPMode post-deadline data (inputs/dataset/structures_unblinded, work/submitted, outputs/...); set CYPMODE_DATA to its path.
SRC = os.environ.get('CYPMODE_DATA', 'CYPMode/data/post_deadline')
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'poses')
os.makedirs(OUT, exist_ok=True)

def parse(path):
    atoms = []
    for l in open(path):
        if l.startswith(('ATOM', 'HETATM')):
            name = l[12:16].strip()
            elem = (l[76:78].strip() or name[:1]).upper()
            atoms.append(dict(rec=l[:6].strip(), name=name, resn=l[17:20].strip(), chain=l[21], resi=int(l[22:26]),
                              xyz=np.array([float(l[30:38]), float(l[38:46]), float(l[46:54])]), elem=elem))
    return atoms

def kabsch(P, Q):
    Pc, Qc = P.mean(0), Q.mean(0)
    H = (P - Pc).T @ (Q - Qc)
    U, S, Vt = np.linalg.svd(H)
    d = np.sign(np.linalg.det(Vt.T @ U.T))
    R = Vt.T @ np.diag([1, 1, d]) @ U.T
    return R, Qc - R @ Pc

def fe_n(fe, lig):
    ns = [a['xyz'] for a in lig if a['elem'] == 'N']
    return min((np.linalg.norm(fe - n) for n in ns), default=float('nan'))

def fmt(rec, serial, name, resn, chain, resi, xyz, elem, occ=1.0):
    nm = name.rjust(4) if len(name) < 4 else name
    return f"{rec:<6}{serial:>5} {nm} {resn:>3} {chain}{resi:>4}    {xyz[0]:8.3f}{xyz[1]:8.3f}{xyz[2]:8.3f}{occ:6.2f}{0:6.2f}          {elem:>2}"

scores = {r['Molecule_Name']: r for r in csv.DictReader(open(f'{SRC}/outputs/structure_submitted_per_compound.csv'))}
index = []
for mid, sc in sorted(scores.items()):
    rel = parse(f'{SRC}/inputs/dataset/structures_unblinded/{mid}.pdb')
    sub = parse(f'{SRC}/work/submitted/{mid}.pdb')
    best = None
    for ch in sorted({a['chain'] for a in rel}):
        fe = [a for a in rel if a['chain'] == ch and a['resn'] == 'HEM' and a['name'] == 'FE']
        lig = [a for a in rel if a['chain'] == ch and a['resn'] == 'LIG']
        if not fe or not lig:
            continue
        d = min(np.linalg.norm(fe[0]['xyz'] - a['xyz']) for a in lig)
        if best is None or d < best[0]:
            best = (d, ch)
    ch = best[1]
    relc = [a for a in rel if a['chain'] == ch]
    rel_lig = [a for a in relc if a['resn'] == 'LIG']
    rel_fe = next(a for a in relc if a['resn'] == 'HEM' and a['name'] == 'FE')['xyz']
    sub_ca = {a['resi']: a['xyz'] for a in sub if a['name'] == 'CA' and a['rec'] == 'ATOM'}
    rel_ca = {a['resi']: a['xyz'] for a in relc if a['name'] == 'CA' and a['rec'] == 'ATOM'}
    common = sorted(set(sub_ca) & set(rel_ca))
    R, t = kabsch(np.array([sub_ca[i] for i in common]), np.array([rel_ca[i] for i in common]))
    rmsd = float(np.sqrt(np.mean(np.sum((np.array([R @ sub_ca[i] + t for i in common]) - np.array([rel_ca[i] for i in common])) ** 2, axis=1))))
    sub_lig = [dict(a, xyz=R @ a['xyz'] + t) for a in sub if a['resn'] == 'LIG']
    sub_fe = next((R @ a['xyz'] + t for a in sub if a['resn'] == 'HEM' and a['name'] == 'FE'), rel_fe)
    # pocket residues of the released chain within 9 A of the released ligand
    lig_xyz = np.array([a['xyz'] for a in rel_lig])
    keep_res = set()
    for a in relc:
        if a['rec'] == 'ATOM' and np.min(np.linalg.norm(lig_xyz - a['xyz'], axis=1)) < 9.0:
            keep_res.add(a['resi'])
    lines, s = [], 1
    for a in relc:
        if (a['rec'] == 'ATOM' and a['resi'] in keep_res) or a['resn'] == 'HEM':
            lines.append(fmt(a['rec'], s, a['name'], a['resn'], 'A', a['resi'], a['xyz'], a['elem'])); s += 1
    for a in rel_lig:
        lines.append(fmt('HETATM', s, a['name'], 'LIG', 'L', 1, a['xyz'], a['elem'])); s += 1
    for a in sub_lig:
        lines.append(fmt('HETATM', s, a['name'], 'PRD', 'P', 1, a['xyz'], a['elem'])); s += 1
    open(f'{OUT}/{mid}.pdb', 'w').write(f'REMARK  {mid}: released structure (chain {ch}) and submitted ligand superposed on CA atoms\n' + '\n'.join(lines) + '\nEND\n')
    index.append(dict(id=mid, lddtPli=round(float(sc['LDDT-PLI']), 3), bisyRmsd=round(float(sc['BiSyRMSD']), 2),
                      feNReleased=round(float(fe_n(rel_fe, rel_lig)), 2), feNSubmitted=round(float(fe_n(sub_fe, sub_lig)), 2),
                      caRmsd=round(rmsd, 2), heavyAtoms=len(rel_lig)))
    print(mid, index[-1])
json.dump(index, open(f'{OUT}/index.json', 'w'), indent=1)
