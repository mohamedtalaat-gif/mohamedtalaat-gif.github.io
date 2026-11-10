"""Add HELIX/SHEET records to the trimmed PDB files, assigned from backbone phi/psi.

The trimmed chain-A files lost the secondary-structure header of the original entries.
This is a geometric assignment (helix: phi -57 +/-35, psi -47 +/-35, runs of 5 or more;
strand: phi -120 +/-45, psi +130 +/-45, runs of 3 or more), good enough to colour a cartoon.
"""
import math, sys
import numpy as np

def dihedral(p0, p1, p2, p3):
    b0, b1, b2 = p0 - p1, p2 - p1, p3 - p2
    b1 /= np.linalg.norm(b1)
    v = b0 - np.dot(b0, b1) * b1
    w = b2 - np.dot(b2, b1) * b1
    x = np.dot(v, w)
    y = np.dot(np.cross(b1, v), w)
    return math.degrees(math.atan2(y, x))

def run(path):
    lines = [l for l in open(path) if not l.startswith(('HELIX', 'SHEET'))]
    res = {}
    order = []
    for l in lines:
        if l.startswith('ATOM'):
            key = (l[21], int(l[22:26]), l[26])
            if key not in res:
                res[key] = {'name': l[17:20]}
                order.append(key)
            res[key][l[12:16].strip()] = np.array([float(l[30:38]), float(l[38:46]), float(l[46:54])])
    ss = {}
    for i in range(1, len(order) - 1):
        a, b, c = res[order[i - 1]], res[order[i]], res[order[i + 1]]
        if not all(k in d for d in (a, b, c) for k in ('N', 'CA', 'C')):
            continue
        if order[i][1] - order[i - 1][1] != 1 or order[i + 1][1] - order[i][1] != 1:
            continue
        phi = dihedral(a['C'], b['N'], b['CA'], b['C'])
        psi = dihedral(b['N'], b['CA'], b['C'], c['N'])
        if abs(phi + 57) < 35 and abs(psi + 47) < 35:
            ss[order[i]] = 'H'
        elif abs(phi + 120) < 45 and abs(psi - 130) < 45:
            ss[order[i]] = 'E'
    segs = []
    cur = None
    for k in order:
        t = ss.get(k)
        if cur and t == cur[0] and k[1] == cur[2][1] + 1:
            cur[2] = k
        else:
            if cur: segs.append(cur)
            cur = [t, k, k] if t else None
    if cur: segs.append(cur)
    out = []
    h = s = 0
    for t, a, b in segs:
        n = b[1] - a[1] + 1
        if t == 'H' and n >= 5:
            h += 1
            out.append(f"HELIX  {h:>3} {h:>3} {res[a]['name']} {a[0]} {a[1]:>4}  {res[b]['name']} {b[0]} {b[1]:>4}  1{'':>30}{n:>5}\n")
        elif t == 'E' and n >= 3:
            s += 1
            out.append(f"SHEET  {s:>3} {'A':>3}{1:>2} {res[a]['name']} {a[0]}{a[1]:>4}  {res[b]['name']} {b[0]}{b[1]:>4}  0\n")
    # keep TITLE first
    head = [l for l in lines if l.startswith('TITLE')]
    rest = [l for l in lines if not l.startswith('TITLE')]
    open(path, 'w').writelines(head + out + rest)
    print(path, 'helices', h, 'strands', s, 'residues', len(order))

for p in sys.argv[1:]:
    run(p)
