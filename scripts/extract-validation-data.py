#!/usr/bin/env python3
"""Tables of the interactive validation reports, read from the CYPMode repository and written to src/data/validation/*.json.

    python3 scripts/extract-validation-data.py                    read the main branch of the repository on GitHub (what the build of the site does)
    CYPMODE_SOURCE=/path/to/CYPMode python3 scripts/extract-validation-data.py    read a local copy instead

Every number is copied from a log or a table of the repository (the path of each source is written beside the table in the file), nothing is computed here except the AUC of a candidate in each outer fold from
the stored out-of-fold predictions and the mean of a column that the log also prints, and a table is refused when its count or its mean differs from what the repository states. A table that cannot be read or
that is refused keeps the file of the last good run and is named in the summary, so that a change of the repository never breaks the build of the site; STRICT=1 makes such a table an error instead. The ligands
of the structure set are numbered 1 to 20 in the order of the table of the explorer (cypmode/explorer), without their names.
"""

from __future__ import annotations

import csv
import gzip
import io
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

SOURCE = os.environ.get("CYPMODE_SOURCE") or (sys.argv[1] if len(sys.argv) > 1 else "")
RAW = "https://raw.githubusercontent.com/mohamedtalaat-gif/CYPMode/main/"
OUT = Path(__file__).resolve().parent.parent / "src/data/validation"
LOGS = "data/structure_track/outputs/cyp3a4/logs/"
STRICT = os.environ.get("STRICT") == "1"
_cache: dict[str, bytes] = {}


def read_bytes(path: str) -> bytes:
    """A file of the repository: from the local copy when CYPMODE_SOURCE is set, else from the main branch on GitHub."""
    if path not in _cache:
        if SOURCE:
            _cache[path] = (Path(SOURCE) / path).read_bytes()
        else:
            request = urllib.request.Request(RAW + path, headers={"User-Agent": "mohamedtalaat-gif.github.io validation sync"})
            with urllib.request.urlopen(request, timeout=60) as response:
                _cache[path] = response.read()
    return _cache[path]


def read(path: str) -> str:
    return read_bytes(path).decode("utf-8")


def rows_of_csv(path: str) -> list[dict[str, str]]:
    return list(csv.DictReader(io.StringIO(read(path))))


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
    text = read(LOGS + "applicability_domain.log")
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
    lines = read(LOGS + "block_holdout.log").splitlines()
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
    lines = read(LOGS + "ligand_dynamics.log").splitlines()
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
    rows = [{"name": r["name"], "log": r["log"], "family": r["stem"], "kind": r["kind"], "verdict": r["verdict"]} for r in rows_of_csv("explorer/public/ledger.csv")]
    assert len(rows) == 187 and sum(r["verdict"] == "MET" for r in rows) == 9
    write("ledger", {"source": "explorer/public/ledger.csv", "rows": rows})


def first_entry() -> None:
    rows = [{k: (int(v) if k in ("ligand", "pool_poses") else float(v)) for k, v in r.items()} for r in rows_of_csv("explorer/full/data/pd_ligands.csv")]
    assert len(rows) == 20
    write("first_entry", {"source": "explorer/full/data/pd_ligands.csv (data/post_deadline/outputs/structure_external_per_compound.csv, ligands numbered 1 to 20)", "rows": rows})


def threshold() -> None:
    rows = [{"enzyme": r["enzyme"], "kind": r["kind"], "call_rate": float(r["call_rate"]), "mcc": float(r["mcc"])} for r in rows_of_csv("explorer/full/data/pd_threshold.csv")]
    assert len(rows) == 122
    write("threshold", {"source": "explorer/full/data/pd_threshold.csv (data/post_deadline/outputs/tdi_question3_ceiling.csv and the stored scores)", "rows": rows})


def relaxation() -> None:
    rows = []
    for line in read(LOGS + "relaxation_gate.log").splitlines():
        m = re.match(r"(bench|exp)-(\S+?)_boltz(\d+)\.pdb: energy (-?\d+) -> (-?\d+) kJ/mol, ligand moved ([\d.]+) A", line)
        if m:
            group = "benchmark" if m.group(1) == "bench" else "expansion"
            rows.append({"group": group, "ligand": m.group(2), "pose": int(m.group(3)), "energy_before": int(m.group(4)), "energy_after": int(m.group(5)), "moved": float(m.group(6))})
    assert len(rows) == 90, len(rows)
    write("relaxation", {"source": "data/structure_track/outputs/cyp3a4/logs/relaxation_gate.log", "rows": rows})


def integrity() -> None:
    text = read("METHOD_REPORT.md")
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
    rows = [{"track": r["track"], "entry": r["entry"], "metric": r["metric"], "scored": float(r["scored"]), "board": float(r["board"])} for r in rows_of_csv("explorer/full/data/pd_gate.csv")]
    assert len(rows) == 6
    write("board", {"source": "explorer/full/data/pd_gate.csv (data/post_deadline/outputs/tdi_gate.json and structure_gate.json)", "rows": rows})


def calibration() -> None:
    lines = read(LOGS + "calibration.log").splitlines()
    start = next(i for i, line in enumerate(lines) if line.split()[:3] == ["isoform", "method", "ece"])
    rows = []
    for line in lines[start + 1 :]:
        parts = line.split()
        if len(parts) != 9 or parts[0] not in ("CYP3A4", "CYP2D6"):
            break
        rows.append({"isoform": parts[0], "method": parts[1], "ece": float(parts[2]), "brier": float(parts[3]), "slope": float(parts[4]), "intercept": float(parts[5]), "mean_pred": float(parts[6]), "mean_obs": float(parts[7]), "gate_met": "yes" if parts[8] == "True" else "no"})
    assert len(rows) == 6, len(rows)
    write("calibration", {"source": "data/structure_track/outputs/cyp3a4/logs/calibration.log", "rows": rows})


def agreement() -> None:
    rows = [{"isoform": r["isoform"], "labelled": int(r["labelled"]), "agree": int(r["agree"]), "disagree": int(r["disagree"]), "not_computable": int(r["not_computable"])} for r in rows_of_csv("data/post_deadline/outputs/tdi_question2a_agreement.csv")]
    assert len(rows) == 2 and all(r["labelled"] == r["agree"] + r["disagree"] + r["not_computable"] for r in rows)
    write("agreement", {"source": "data/post_deadline/outputs/tdi_question2a_agreement.csv", "rows": rows})


def permutation() -> None:
    rows = []
    for enzyme in ("CYP3A4", "CYP2D6"):
        text = read(LOGS + f"permutation_control_{enzyme}.log")
        header = re.search(rf"{enzyme}: (\d+) classification candidates, (\d+) repeats? of (\d+) outer folds, (\d+) permutations of the (\d+) pool labels", text)
        assert header, enzyme
        for m in re.finditer(r"z0=([\d.]+)\s+real labels: AUC ([\d.]+), MCC ([+-][\d.]+) \| permuted: AUC ([\d.]+) \(range ([\d.]+) to ([\d.]+)\), MCC ([+-][\d.]+) \(range ([+-][\d.]+) to ([+-][\d.]+)\)", text):
            rows.append(
                {
                    "enzyme": enzyme,
                    "cut": f"z0 = {m.group(1)}",
                    "pool": int(header.group(5)),
                    "permutations": int(header.group(4)),
                    "real_auc": float(m.group(2)),
                    "real_mcc": float(m.group(3)),
                    "perm_auc": float(m.group(4)),
                    "perm_lo": float(m.group(5)),
                    "perm_hi": float(m.group(6)),
                    "perm_mcc": float(m.group(7)),
                    "mcc_lo": float(m.group(8)),
                    "mcc_hi": float(m.group(9)),
                }
            )
    assert len(rows) == 4, len(rows)
    write("permutation", {"source": f"{LOGS}permutation_control_CYP3A4.log and permutation_control_CYP2D6.log", "rows": rows})


def committee() -> None:
    rows = []
    for enzyme in ("CYP3A4", "CYP2D6"):
        text = read(LOGS + f"committee_label_model_{enzyme}.log")
        for cut in ("1.0", "1.96"):
            members = {name: float(auc) for name, auc in re.findall(rf"z0={re.escape(cut)}\s+diagnostic committee_(\w+)_A\+fps: outer AUC ([\d.]+)", text)}
            stack = re.search(rf"z0={re.escape(cut)}\s+stacked base\+added vs base: AUC ([+-][\d.]+) \(p=([\d.]+), better (\d+)/(\d+)\)", text)
            cal = re.search(rf"z0={re.escape(cut)}\s+ECE ([\d.]+)\s+Brier ([\d.]+)\s+slope ([\d.]+)\s+mean predicted ([\d.]+) vs observed ([\d.]+)", text)
            assert stack and cal and len(members) == 3, (enzyme, cut)
            rows.append(
                {
                    "enzyme": enzyme,
                    "cut": f"z0 = {cut}",
                    "auc_m": members["m"],
                    "auc_p": members["p"],
                    "auc_ei": members["ei"],
                    "change": float(stack.group(1)),
                    "p": float(stack.group(2)),
                    "better": f"{stack.group(3)} of {stack.group(4)}",
                    "ece": float(cal.group(1)),
                    "brier": float(cal.group(2)),
                    "slope": float(cal.group(3)),
                    "mean_pred": float(cal.group(4)),
                    "mean_obs": float(cal.group(5)),
                }
            )
    assert len(rows) == 4
    write("committee", {"source": f"{LOGS}committee_label_model_CYP3A4.log and committee_label_model_CYP2D6.log", "rows": rows})


def label_shift() -> None:
    text = read(LOGS + "label_shift.log")
    rows = []
    for enzyme in ("CYP3A4", "CYP2D6"):
        block = text[text.index(f"LABEL SHIFT {enzyme}:") :]
        nxt = block.find("LABEL SHIFT", 5)
        block = block if nxt < 0 else block[:nxt]
        for m in re.finditer(r"z0 = ([\d.]+) (\S+): all compounds ([\d.]+) \(([\d.]+) to ([\d.]+)\); scored compounds by transfer ([\d.]+) \(([\d.]+) to ([\d.]+)\), directly ([\d.]+) \(([\d.]+) to ([\d.]+)\); spread over folds ([\d.]+)", block):
            g = m.groups()
            for kind, est, lo, hi in (("All compounds", g[2], g[3], g[4]), ("Scored compounds, by transfer", g[5], g[6], g[7]), ("Scored compounds, directly", g[8], g[9], g[10])):
                rows.append({"enzyme": enzyme, "cut": f"z0 = {g[0]}", "classifier": g[1], "estimate_of": kind, "rate": float(est), "lo": float(lo), "hi": float(hi), "fold_spread": float(g[11])})
    assert len(rows) == 24, len(rows)
    write("label_shift", {"source": LOGS + "label_shift.log", "rows": rows})


def selection() -> None:
    text = read("METHOD_REPORT.md")
    section = text[text.index("## 7. Selection-aware CYP2D6 model") :]
    section = section[: section.index("\n## 8.")]
    rows = []
    pattern = r"z0=([\d.]+)\s+non-hit weight ([\d.]+)\s+\| S0 AUC ([\d.]+) MCC ([+-][\d.]+) \| S1 AUC ([\d.]+) MCC ([+-][\d.]+) \| S2 AUC ([\d.]+) MCC ([+-][\d.]+) \| S3 AUC ([\d.]+) MCC ([+-][\d.]+)"
    for m in re.finditer(pattern, section):
        g = m.groups()
        rows.append({"cut": f"z0 = {g[0]}", "weight": float(g[1]), **{f"s{i}_auc": float(g[2 + 2 * i]) for i in range(4)}, **{f"s{i}_mcc": float(g[3 + 2 * i]) for i in range(4)}})
    assert len(rows) == 10, len(rows)
    est = re.search(r"equivalent non-hit weight on the job-012 axis: ([\d.]+) \(95%: ([\d.]+)-([\d.]+)\)", section)
    assert est
    headline = re.search(r"S3 \+end-to-end\s+outer AUC ([\d.]+)", section)
    base = re.search(r"S0 hits-only\s+outer AUC ([\d.]+)", section)
    assert headline and base and abs(float(headline.group(1)) - rows[4]["s3_auc"]) < 0.001 and abs(float(base.group(1)) - rows[4]["s0_auc"]) < 0.001  # the headline pair of the report is the row of weight 1.0 at z0 = 1.0
    write("selection", {"source": "METHOD_REPORT.md, section 7", "meta": {"estimate": float(est.group(1)), "lo": float(est.group(2)), "hi": float(est.group(3))}, "rows": rows})


def auc_of(y: list[int], score: list[float]) -> float:
    """The probability that a positive outranks a negative, ties counting one half (the same definition as the explorer of the repository)."""
    order = sorted(range(len(score)), key=lambda i: score[i])
    ranks = [0.0] * len(score)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and score[order[j + 1]] == score[order[i]]:
            j += 1
        for k in range(i, j + 1):
            ranks[order[k]] = (i + j) / 2 + 1
        i = j + 1
    positives = sum(y)
    negatives = len(y) - positives
    return (sum(r for r, label in zip(ranks, y, strict=True) if label) - positives * (positives + 1) / 2) / (positives * negatives)


def nested() -> None:
    families = {r["candidate"]: r["family"] for r in rows_of_csv("explorer/public/candidates.csv")}
    rows = []
    for enzyme in ("CYP3A4", "CYP2D6"):
        table = list(csv.reader(io.StringIO(gzip.decompress(read_bytes(f"explorer/public/oof_{enzyme}.csv.gz")).decode())))
        header, body = table[0], table[1:]
        column = {name: i for i, name in enumerate(header)}
        y = [int(float(r[column["y"]])) for r in body]
        names = sorted({name.rsplit("|", 1)[0] for name in header if "|" in name and not name.startswith("fold|")})
        for name in names:
            aucs = []
            for repeat in range(3):
                folds = [r[column[f"fold|{repeat}"]] for r in body]
                scores = [r[column[f"{name}|{repeat}"]] for r in body]
                for fold in sorted({f for f in folds if f != ""}):
                    pick = [i for i, f in enumerate(folds) if f == fold and scores[i] != ""]
                    yy = [y[i] for i in pick]
                    if 0 < sum(yy) < len(yy):
                        aucs.append(auc_of(yy, [float(scores[i]) for i in pick]))
            assert len(aucs) == 15, (enzyme, name, len(aucs))
            rows.append({"enzyme": enzyme, "candidate": name, "family": families.get(name, "other"), "mean_auc": round(sum(aucs) / 15, 4), "min_auc": round(min(aucs), 4), "max_auc": round(max(aucs), 4), "folds": 15, "pool": len(y)})
    best = next(r for r in rows if r["enzyme"] == "CYP3A4" and r["candidate"] == "lgbm_A+fps+ext+alerts_deep")
    assert abs(best["mean_auc"] - 0.775) < 0.0006  # the cross-validated AUC that the log of the test-like holdout prints for the same candidate
    write("nested", {"source": "explorer/public/oof_CYP3A4.csv.gz and oof_CYP2D6.csv.gz (AUC in each of the 15 outer folds of the stored out-of-fold predictions)", "rows": rows})


STEPS = (applicability, holdout, dynamics, ledger, first_entry, threshold, relaxation, integrity, board, calibration, agreement, permutation, committee, label_shift, selection, nested)
kept = []
for step in STEPS:
    try:
        step()
    except Exception as error:  # a table that cannot be read or is refused keeps the file of the last good run
        if STRICT:
            raise
        kept.append(step.__name__)
        print(f"{step.__name__}: kept the last good file ({type(error).__name__}: {str(error)[:160]})")
print(f"{len(STEPS) - len(kept)} tables written, {len(kept)} kept" + (f": {', '.join(kept)}" if kept else ""))
