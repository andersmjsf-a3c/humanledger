#!/usr/bin/env python3
"""Check a scorecard, preview it in plain words, and make its review link.

It runs the same checks the site runs before it accepts a card, so a card that passes here
will pass there. It never sends anything: no network, no files written.

  python3 scripts/card.py check   CARD.json [--hold a,b]
  python3 scripts/card.py preview CARD.json [--hold a,b]
  python3 scripts/card.py link    CARD.json [--hold a,b]
"""
import base64
import datetime as dt
import json
import re
import sys
from pathlib import Path

SITE_URL = "{{SITE_URL}}"  # filled in when the skill is downloaded from the site
GRADER_VERSION = "g1.2"
MAX_BYTES = 4096
EARLIEST = "2026-01-01"

HERE = Path(__file__).resolve().parent.parent
SCHEMA = json.loads((HERE / "references" / "scorecard.schema.json").read_text(encoding="utf-8"))
LABELS = json.loads((HERE / "references" / "labels.json").read_text(encoding="utf-8"))
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


# --- schema checks (the subset of JSON Schema the scorecard uses) ---

def _resolve(ref):
    node = SCHEMA
    for part in ref.lstrip("#/").split("/"):
        node = node[part]
    return node


def _type_ok(t, v):
    return {
        "object": isinstance(v, dict),
        "array": isinstance(v, list),
        "string": isinstance(v, str),
        "boolean": isinstance(v, bool),
        "integer": isinstance(v, int) and not isinstance(v, bool),
    }[t]


def _check(node, v, path, errs):
    if "$ref" in node:
        return _check(_resolve(node["$ref"]), v, path, errs)
    if "oneOf" in node:
        passing = [b for b in node["oneOf"] if not _check_quiet(b, v)]
        if len(passing) != 1:
            # report against the branch whose kind matches, so the message is useful
            kind = v.get("kind") if isinstance(v, dict) else None
            branch = SCHEMA["$defs"].get(kind) if isinstance(kind, str) else None
            if branch is not None:
                _check(branch, v, path, errs)
            else:
                errs.append(f"{path or '/'} is not a deliverable, skill_retest, or worksheet card")
        return
    if "const" in node and v != node["const"]:
        errs.append(f"{path} must be {node['const']!r}")
    if "enum" in node and (isinstance(v, bool) or v not in node["enum"]):
        errs.append(f"{path} must be one of the schema's categories, not {v!r}")
    if "type" in node and not _type_ok(node["type"], v):
        errs.append(f"{path} must be a {node['type']}")
        return
    if isinstance(v, int) and not isinstance(v, bool):
        if "minimum" in node and v < node["minimum"]:
            errs.append(f"{path} must be at least {node['minimum']}")
        if "maximum" in node and v > node["maximum"]:
            errs.append(f"{path} must be at most {node['maximum']}")
    if isinstance(v, str):
        if "pattern" in node and not re.search(node["pattern"], v):
            errs.append(f"{path} must be a date, YYYY-MM-DD")
        elif node.get("format") == "date":
            try:
                dt.date.fromisoformat(v)
            except ValueError:
                errs.append(f"{path} is not a real date")
    if isinstance(v, list):
        if "maxItems" in node and len(v) > node["maxItems"]:
            errs.append(f"{path} has too many items")
        if node.get("uniqueItems") and len({json.dumps(x) for x in v}) != len(v):
            errs.append(f"{path} has repeats")
        for i, x in enumerate(v):
            _check(node.get("items", {}), x, f"{path}/{i}", errs)
    if isinstance(v, dict):
        props = node.get("properties", {})
        for k in node.get("required", []):
            if k not in v:
                errs.append(f"{path}/{k} is required")
        for k, x in v.items():
            if k in props:
                _check(props[k], x, f"{path}/{k}", errs)
            elif node.get("additionalProperties") is False:
                errs.append(f"{path}/{k} is not a scorecard field")


def _check_quiet(node, v):
    errs = []
    _check(node, v, "", errs)
    return errs


def server_checks(card, today=None):
    errs = []
    today = today or dt.datetime.now(dt.timezone.utc).date()
    latest = (today + dt.timedelta(days=1)).isoformat()
    for k in ("graded_on", "last_edited_on"):
        if k in card and isinstance(card[k], str) and not (EARLIEST <= card[k] <= latest):
            errs.append(f"{k} out of range")
    if card.get("facts_corrected", 0) > card.get("facts_checked", 0):
        errs.append("facts_corrected > facts_checked")
    if card.get("test_cases_passed", 0) > card.get("test_cases_run", 0):
        errs.append("test_cases_passed > test_cases_run")
    for rem, found in (("voice_flags_remaining", "voice_flags_found"), ("ai_tell_flags_remaining", "ai_tell_flags_found")):
        for k, n in (card.get(rem) or {}).items():
            if n > (card.get(found) or {}).get(k, 0):
                errs.append(f"{rem}.{k} > {found}.{k}")
    return errs


def compact(card):
    return json.dumps(card, separators=(",", ":"), ensure_ascii=False)


def check(card, today=None):
    if len(compact(card).encode("utf-8")) > MAX_BYTES:
        return ["over 4 KB"]
    errs = _check_quiet(SCHEMA, card)
    return errs or server_checks(card, today)


# --- hold back, preview, link ---

def required_keys(card):
    branch = SCHEMA["$defs"].get(card.get("kind"), {})
    return branch.get("required", list(card))


def hold_back(card, held):
    req = set(required_keys(card))
    return {k: v for k, v in card.items() if k in req or k not in held}


def _value(v, field=""):
    if isinstance(v, bool):
        return "Yes" if v else "No"
    if isinstance(v, int):
        return f"{v:,}"
    if isinstance(v, str):
        return LABELS["values"].get(v, v.replace("_", " "))
    if isinstance(v, list):
        return ", ".join(_value(x) for x in v) or "None"
    if isinstance(v, dict):
        if field in LABELS["countFields"]:
            parts = [f"{_value(x)} {LABELS['values'].get(k, k.replace('_', ' '))}" for k, x in v.items()]
        else:
            parts = [f"{LABELS['subfields'].get(k, k.replace('_', ' '))}: {_value(x)}" for k, x in v.items()]
        return ", ".join(parts) or "None"
    return str(v)


def rows(card):
    order = list(LABELS["fields"])
    rank = lambda k: order.index(k) + 1 if k in order else len(order) + 1
    return [{"key": k, "label": LABELS["fields"].get(k, k), "value": _value(card[k], k)} for k in sorted(card, key=rank)]


def warnings(card):
    r = card.get("receipt") or {}
    out = []
    if r.get("network_attempts", 0) > 0:
        out.append(f"The receipt shows {r['network_attempts']} network attempt(s). There should be none.")
    if r.get("content_transmitted") is True:
        out.append("The receipt says content left the conversation. It never should.")
    if r.get("boundary_events", 0) > 0:
        out.append(f"{r['boundary_events']} request(s) outside the grader's job were refused.")
    return out


def preview(card):
    lines = ["**Your scorecard (not sent)**", "", "| | |", "|---|---|"]
    lines += [f"| {r['label']} | {r['value']} |" for r in rows(card)]
    lines += ["", "The exact data that would go:", "```json", json.dumps(card, indent=2, ensure_ascii=False), "```",
              "Not in here: any words from your work, file names, or names of people or companies."]
    for w in warnings(card):
        lines.append(f"Check before sending: {w}")
    lines += ["", "You can: **send it**, **hold back** any line, **change** an answer you gave me, or **discard** it."]
    return "\n".join(lines)


def encode(card):
    raw = base64.urlsafe_b64encode(compact(card).encode("utf-8")).decode("ascii")
    return "v1." + raw.rstrip("=")


def link(card):
    if "{{" in SITE_URL:
        raise SystemExit("This copy of the skill has no site address. Download it again from the site's grader page.")
    return f"{SITE_URL.rstrip('/')}/review#{encode(card)}"


def main(argv):
    if len(argv) >= 2 and argv[0] == "batch-check":  # for the site's tests: a JSON list in, a list of verdicts out
        cards = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
        today = dt.date.fromisoformat(argv[2]) if len(argv) > 2 else None
        print(json.dumps([{"ok": not check(c, today), "rows": rows(c) if isinstance(c, dict) else []} for c in cards]))
        return 0
    if len(argv) < 2 or argv[0] not in ("check", "preview", "link"):
        print(__doc__)
        return 2
    cmd, path = argv[0], argv[1]
    held = []
    if "--hold" in argv:
        held = [h.strip() for h in argv[argv.index("--hold") + 1].split(",") if h.strip()]
    try:
        card = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        print(f"Can't read the card: {e}")
        return 1
    if not isinstance(card, dict):
        print("A card is one JSON object.")
        return 1
    card = hold_back(card, held)
    errs = check(card)
    if errs:
        print("Not a valid scorecard yet. Fix these and run again:")
        print("\n".join(f"- {e}" for e in errs))
        return 1
    if cmd == "check":
        print("ok")
    elif cmd == "preview":
        print(preview(card))
    else:
        print(link(card))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
