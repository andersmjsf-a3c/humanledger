#!/usr/bin/env python3
"""Runs the original ai_tells.py (reference/) on every fixture and records the generic part of its
report: the HARD and AI TELLS lines, minus Mark's house style (the STYLE group and the dash rules).
Usage: python3 scripts/baseline-parity.py [--check]
Writes tests/fixtures/linter-expected.json, or with --check fails if it would change."""
import json, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIX = ROOT / "tests/fixtures/linter"
OUT = ROOT / "tests/fixtures/linter-expected.json"
HOUSE = ("EM DASH ", "EN DASH AS DASH ", "DOUBLE HYPHEN ")

def run(path):
    args = [sys.executable, str(ROOT / "reference/ai_tells.py"), str(path)] + (["--email"] if "email" in path.name else [])
    out = subprocess.run(args, capture_output=True, text=True).stdout.splitlines()
    groups, cur = {"hard": [], "tells": []}, None
    for line in out:
        if line.startswith("HARD"): cur = "hard"
        elif line.startswith("AI TELLS"): cur = "tells"
        elif line.startswith("HOUSE STYLE"): cur = None
        elif line.startswith("  - ") and cur:
            item = line[4:]
            if not item.startswith(HOUSE): groups[cur].append(item)
    return groups

result = {p.name: run(p) for p in sorted(FIX.glob("*.md"))}
text = json.dumps(result, indent=1, ensure_ascii=False) + "\n"
if "--check" in sys.argv:
    if not OUT.exists() or OUT.read_text() != text:
        print("linter-expected.json is out of date with reference/ai_tells.py; run scripts/baseline-parity.py"); sys.exit(1)
    print("parity fixtures current")
else:
    OUT.write_text(text); print(f"wrote {OUT.relative_to(ROOT)}")
