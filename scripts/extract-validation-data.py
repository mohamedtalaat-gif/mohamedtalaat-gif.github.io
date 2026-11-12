#!/usr/bin/env python3
"""Tables of the interactive validation reports, read from the CYPMode repository and written to src/data/validation/*.json.

    python3 scripts/extract-validation-data.py [/path/to/CYPMode]

Every number is copied from a log or a table of the repository (the path of each source is written beside the table in the file), nothing is computed here except the mean of a column that the log also
prints, and the script stops when that mean differs from the printed one. The ligands of the structure set are numbered 1 to 20 in the order of the table of the explorer (cypmode/explorer), without their names.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/Volumes/Data/CYPMode")
OUT = Path(__file__).resolve().parent.parent / "src/data/validation"
LOGS = ROOT / "data/structure_track/outputs/cyp3a4/logs"


def write(name: str, payload: dict) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{name}.json").write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n")
    print(f"{name}.json: {len(payload['rows'])} rows")


def bin_label(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("<"):
        return f"below {raw[1:].strip()}"
    if raw.startswith(">="):
        return f"{raw[2:].strip()} and above"
    return raw.replace(" - ", " to ")


def applicability() -> None:
    text = (LOGS / "applicability_domain.log").read_text()
    rows, enzyme, cut = [], None, None
    for line in text.splitlines():
        if line.startswith("## "):
            enzyme = line[3:].strip()
        m = re.match(r"Confidence cut z0 = ([\d.]+):", line)
        if m:
            cut = f"z0 = {m.group(1)}"
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if line.startswith("|") and len(cells) == 7 and cells[1].isdigit():
            auc, interval = cells[3], cells[4]
            lo, hi = (None, None) if auc == "n/a" else (float(interval.split(" to ")[0]), float(interval.split(" to ")[1]))
            rows.append(
                {
                    "enzyme": enzyme,
                    "cut": cut,
                    "bin": bin_label(cells[0]),
                    "held_out": int(cells[1]),
                    "positive_share": float(cells[2]),
                    "auc": None if auc == "n/a" else float(auc),
                    "lo": lo,
                    "hi": hi,
                    "tier": cells[5],
                    "blinded": int(cells[6]),
                }
            )
    assert len(rows) == 24, len(rows)  # two enzymes, two cuts, six bins
    write("applicability", {"source": "data/structure_track/outputs/cyp3a4/logs/applicability_domain.log", "rows": rows})


FAMILIES = (("knn_", "Nearest neighbours"), ("svm_", "Support vector machine"), ("lgbm_", "LightGBM"), ("extratrees", "Extremely randomised trees"), ("rf_", "Random forest"))


def holdout() -> None:
    lines = (LOGS / "block_holdout.log").read_text().splitlines()
    start = next(i for i, line in enumerate(lines) if line.strip().startswith("candidate") and "block_auc" in line)
    rows = []
    for line in lines[start + 1 :]:
        parts = line.split()
        if len(parts) != 7:
            break
        name = parts[0]
        rows.append(
            {
                "candidate": name,
                "family": next(label for prefix, label in FAMILIES if name.startswith(prefix)),
                "cv_auc": float(parts[1]),
                "block_auc": float(parts[2]),
                "lo": float(parts[3]),
                "hi": float(parts[4]),
                "block_ap": float(parts[5]),
                "block_mcc": float(parts[6]),
            }
        )
    assert len(rows) == 19, len(rows)
    write("holdout", {"source": "data/structure_track/outputs/cyp3a4/logs/block_holdout.log", "rows": rows})


SCORES = {"dynamic_pharmacophore": 4, "stability": 6, "dynamic_combined": 8, "static_pharmacophore_model": 10}
PRINTED = {"dynamic_pharmacophore": -0.214, "stability": 0.042, "dynamic_combined": -0.071, "static_pharmacophore_model": -0.240}


def dynamics() -> None:
    lines = (LOGS / "ligand_dynamics.log").read_text().splitlines()
    rows, seen_header = [], 0
    for line in lines:
        parts = line.split()
        if parts and parts[0] == "compound":
            seen_header += 1
            continue
        if seen_header == 1 and len(parts) == 11 and parts[0].startswith("bench-"):  # the first table is the regime of the gate
            for score, index in SCORES.items():
                rows.append({"ligand": parts[0][6:], "score": score, "poses": int(parts[1]), "rho": float(parts[index])})
    assert len(rows) == 40, len(rows)
    for score, printed in PRINTED.items():
        mean = sum(r["rho"] for r in rows if r["score"] == score) / 10
        assert abs(mean - printed) < 0.0015, (score, mean, printed)  # the mean that the log prints for the gate
    write("dynamics", {"source": "data/structure_track/outputs/cyp3a4/logs/ligand_dynamics.log", "rows": rows})


def ledger() -> None:
    with (ROOT / "explorer/public/ledger.csv").open() as handle:
        rows = [{"name": r["name"], "log": r["log"], "family": r["stem"], "kind": r["kind"], "verdict": r["verdict"]} for r in csv.DictReader(handle)]
    assert len(rows) == 187 and sum(r["verdict"] == "MET" for r in rows) == 9
    write("ledger", {"source": "explorer/public/ledger.csv", "rows": rows})


def first_entry() -> None:
    with (ROOT / "explorer/full/data/pd_ligands.csv").open() as handle:
        rows = [{k: (int(v) if k in ("ligand", "pool_poses") else float(v)) for k, v in r.items()} for r in csv.DictReader(handle)]
    assert len(rows) == 20
    write("first_entry", {"source": "explorer/full/data/pd_ligands.csv (data/post_deadline/outputs/structure_external_per_compound.csv, ligands numbered 1 to 20)", "rows": rows})


def threshold() -> None:
    with (ROOT / "explorer/full/data/pd_threshold.csv").open() as handle:
        rows = [{"enzyme": r["enzyme"], "kind": r["kind"], "call_rate": float(r["call_rate"]), "mcc": float(r["mcc"])} for r in csv.DictReader(handle)]
    assert len(rows) == 122
    write("threshold", {"source": "explorer/full/data/pd_threshold.csv (data/post_deadline/outputs/tdi_question3_ceiling.csv and the stored scores)", "rows": rows})


def relaxation() -> None:
    rows = []
    for line in (LOGS / "relaxation_gate.log").read_text().splitlines():
        m = re.match(r"(bench|exp)-(\S+?)_boltz(\d+)\.pdb: energy (-?\d+) -> (-?\d+) kJ/mol, ligand moved ([\d.]+) A", line)
        if m:
            group = "benchmark" if m.group(1) == "bench" else "expansion"
            rows.append({"group": group, "ligand": m.group(2), "pose": int(m.group(3)), "energy_before": int(m.group(4)), "energy_after": int(m.group(5)), "moved": float(m.group(6))})
    assert len(rows) == 90, len(rows)
    write("relaxation", {"source": "data/structure_track/outputs/cyp3a4/logs/relaxation_gate.log", "rows": rows})


def integrity() -> None:
    text = (ROOT / "METHOD_REPORT.md").read_text()
    block = text[text.index("### Audit extract: Data integrity") :]
    block = block[: block.index("\n## ")]
    rows = []
    for line in block.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if line.startswith("|") and len(cells) == 2 and cells[1] == "0":
            rows.append({"group": "files", "check": cells[0], "result": "0", "status": "passed"})
    assert len(rows) == 7, len(rows)
    for line in block.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if line.startswith("| CYP") and len(cells) == 7 and cells[2] == "0" and "." in cells[4]:
            rows.append({"group": f"label rule, {cells[0]}", "check": f"label-rule mismatches in {int(cells[1]):,} rows with both measurements", "result": "0", "status": "passed"})
        if line.startswith("| CYP") and len(cells) == 7 and cells[3] == "True":
            for name, value in zip(("training and evaluation folds are disjoint", "training and evaluation folds cover the pool", "external compounds are not in the pool", "inner folds lie inside the outer training fold"), cells[3:], strict=True):
                assert value == "True"
                rows.append({"group": f"nested plan, {cells[0]}", "check": name, "result": "true", "status": "passed"})
    assert len(rows) == 17, len(rows)
    write("integrity", {"source": "METHOD_REPORT.md, section 2 (audit extract: data integrity)", "rows": rows})


def board() -> None:
    with (ROOT / "explorer/full/data/pd_gate.csv").open() as handle:
        rows = [{"track": r["track"], "entry": r["entry"], "metric": r["metric"], "scored": float(r["scored"]), "board": float(r["board"])} for r in csv.DictReader(handle)]
    assert len(rows) == 6
    write("board", {"source": "explorer/full/data/pd_gate.csv (data/post_deadline/outputs/tdi_gate.json and structure_gate.json)", "rows": rows})


for step in (applicability, holdout, dynamics, ledger, first_entry, threshold, relaxation, integrity, board):
    step()
