#!/usr/bin/env python3
"""Flag AI writing tells in a draft. Usage: python ai_tells.py draft.md [--email]
Patterns follow Wikipedia's "Signs of AI writing" plus Mark's house rules.
Exit 1 when anything is flagged. Signs are evidence, not proof: fix the underlying
problem (vague, generic, inflated content), never just swap the word."""
import re, sys
from collections import Counter

EM, EN, ARROW = chr(0x2014), chr(0x2013), chr(0x21A9)
CURLY = "[" + chr(0x201C) + chr(0x201D) + chr(0x2018) + chr(0x2019) + "]"
EMOJI = "[" + chr(0x1F300) + "-" + chr(0x1FAFF) + chr(0x2600) + "-" + chr(0x27BF) + "]"
LENTIC = chr(0x3010)

# Hard residue: never acceptable in a deliverable.
HARD = {
 "chatbot residue": ["certainly!","of course!","great question","you're absolutely right","i hope this helps",
   "hope this helps","let me know if you","would you like me","would you like a","is there anything else",
   "feel free to","happy to help","more detailed breakdown","here's a draft","here is a draft","here is a revised",
   "here's a revised","as an ai","as a large language model","as of my last","knowledge cutoff","my last training"],
 "availability disclaimer": ["while specific details are","not widely available","not widely documented",
   "not publicly disclosed","not widely disclosed","based on available information","in the provided sources",
   "in the available sources","based on the search results","maintains a low profile","keeps personal details private"],
}
# AI tells: rewrite the idea when these appear.
TELLS = {
 "significance puffery": ["a testament to","is a reminder","stands as","serves as","marks a","marking the","shaping the",
   "represents a shift","plays a vital role","plays a pivotal role","plays a crucial role","plays a key role",
   "pivotal moment","key turning point","watershed","lasting impact","indelible","enduring legacy","setting the stage",
   "paving the way","reflects broader","underscore","highlights the importance","highlights its","deeply rooted",
   "evolving landscape","focal point","contributing to the"],
 "copula avoidance (say is/has)": ["functions as","operates as","boasts","features a","holds the distinction",
   "began his career as","began her career as","ventured into"],
 "canned notability": ["featured in","profiled in","profiled by","independent coverage","trade publications",
   "media outlets","active social media presence","widely recognized","has been recognized","was identified by",
   "awards and recognition"],
 "vague connection": ["associated with","connected with","in connection with","in association with"],
 "promo puffery": ["rich heritage","rich history","vibrant","nestled","in the heart of","breathtaking","stunning",
   "must-visit","renowned","groundbreaking","world-class","cutting-edge","state-of-the-art","best-in-class","showcas",
   "exemplif","commitment to","diverse array","game-changer","game-changing","revolutioniz","transformative",
   "seamless","robust","holistic"],
 "AI vocabulary": ["delve","tapestry","intricate","interplay","multifaceted","garner","bolster","foster","facilitate",
   "streamline","elevate","embark","realm","myriad","plethora","leverage","harness","unlock","empower","synergy",
   "paradigm","align with","resonate","navigate the","key insights","valuable insights","valuable","meticulous",
   "commendable","enhanc","enduring","emphasiz","encompass","cultivat","crucial","ever-evolving","rapidly evolving",
   "in today's","in an era of","journey"],
 "stiff word swaps": ["utiliz","authored","relocated","commenced","endeavor","passed away"],
 "editorializing": ["it's important to note","it is important to note","it's important to remember",
   "it's worth noting","it is worth noting","worth mentioning","notably","importantly","crucially",
   "it goes without saying","needless to say","no discussion of","may vary"],
 "stiff connectors": ["moreover","furthermore","additionally,","in addition,","consequently,","thus,","hence,",
   "that said","having said that","with that in mind","in conclusion","in summary","to sum up","overall,","ultimately,"],
 "vague attribution": ["experts say","experts argue","experts believe","industry reports","observers have",
   "some critics","critics argue","many believe","it is widely","widely regarded","widely considered",
   "several sources","various sources","numerous reports","studies show","research shows","research suggests",
   "according to some","has been described as","should be treated as"],
 "challenges formula": ["despite its","despite these challenges","faces challenges","faces several challenges",
   "future outlook","future prospects","remains to be seen","only time will tell","continues to thrive","looking ahead"],
 "procedural assurance": ["ensured that","while preserving","preserving the original","retained the",
   "improved clarity","clarity and flow","refined the tone","refined tone","in compliance with"],
 "stiff correspondence": ["i am writing to","i hope this email finds","i hope this finds you","i trust this message",
   "i hope this message finds","i understand your concern","i wanted to reach out","just circling back",
   "just following up","dear team"],
 "stock lines": ["here's the thing","here's the kicker","the reality is","make no mistake","let that sink in",
   "in plain terms","the truth is","at the end of the day","when it comes to","in terms of","the bottom line",
   "buckle up","let's dive","deep dive"],
}
# Mark's house style. Wikipedia notes humans use hedges and intensifiers MORE than models,
# so these are style fixes, not evidence of AI. Never cite them in an audit as AI signs.
STYLE = {
 "hedges (house style)": ["perhaps","arguably","it seems","it appears","may well","might just","to some extent",
   "somewhat","in many ways","it could be said","some might say","can be seen as"],
 "honesty theater (house style)": ["i want to be honest","to be honest","honestly","frankly","let me be clear",
   "let me be direct","i'll be blunt"],
 "intensifiers (house style)": ["truly","genuinely","incredibly","extremely","undeniably","remarkabl","profound","exciting"],
}
HARD_PATTERNS = {
 "placeholder": r"\[(?:your|insert|name|company|date|placeholder|tbd|xx)[^\]]*\]|\((?:add your|if available|insert)[^)]*\)|\bINSERT\b|\bXX+\b|\b20\d\d-xx-xx\b|lorem ipsum",
 "AI markup leak": r"contentReference|oaicite|oai_citation|turn0(?:search|image|news|file)\d|attributableIndex|\[cite:\s*\d|start_span|end_span|grok_card|grok_render|\[attached_file:\d|\[web:\d|ppl-ai-file-upload|:::writing|" + LENTIC + r"\d+" + chr(0x2020) + "|" + ARROW,
 "AI tracking link": r"utm_source=(?:chatgpt|openai|perplexity|copilot|gemini|claude)|referrer=grok",
}
PATTERNS = {
 "negative parallelism (not X, it's Y)": r"\b(?:it's|it is|that's|this is|this isn't|it isn't|that isn't|isn't|not) (?:just |only |merely |about )?[^.;\n]{2,60}[,;.] (?:but|it's|that's|this is|it is)\b",
 "not only... but also": r"\bnot only\b[^.]{0,80}\bbut (?:also)?\b",
 "no X, no Y, just Z": r"\bno [^,.\n]{1,30}, no [^,.\n]{1,30}, (?:just|only)\b",
 "-ing analysis tail": r", (?:highlighting|underscoring|emphasizing|reflecting|symbolizing|showcasing|demonstrating|illustrating|ensuring|contributing to|solidifying|cementing|signaling|fostering|cultivating|enhancing|encompassing|paving)\b",
 "hedging preamble": r"\b(?:while|although) (?:relatively |somewhat )?(?:minor|small|modest|limited|niche|lesser-known)\b",
 "false range (from X to Y)": r"\bfrom (?:\w+ ){1,3}to (?:\w+ ){0,2}\w+,? (?:and|to) ",
 "emoji": EMOJI,
 "bold inline-header bullet": r"^\s*(?:[-*" + chr(0x2022) + r"]|\d+\.)\s*\*\*[^*]{1,40}:?\*\*:?",
 "exclamation": r"!(?!\[)",
}

def sentences(t):
    t = re.sub(r"\s+", " ", t)
    return [s for s in re.split(r"(?<=[.!?])\s+(?=[A-Z\"(])", t) if len(s.split()) >= 3]

def scan(groups, low, out, suffix=""):
    for cat, words in groups.items():
        hits = Counter({w: low.count(w) for w in words if low.count(w)})
        if hits:
            out.append(f"{cat.upper()}{suffix}: " + ", ".join(f"'{w.strip(',')}' x{c}" for w, c in hits.most_common()))

def main():
    if len(sys.argv) < 2: print(__doc__); sys.exit(2)
    raw = open(sys.argv[1], encoding="utf-8").read()
    email = "--email" in sys.argv
    body = re.sub(r"\[MARK:[^\]]*\]", "", raw)
    low = body.lower()
    hard, tells, style = [], [], []
    scan(HARD, low, hard, " (hard zero)")
    for name, pat in HARD_PATTERNS.items():
        n = len(re.findall(pat, body, re.I | re.M))
        if n: hard.append(f"{name.upper()} x{n} (hard zero)")
    if EM in body: hard.append(f"EM DASH x{body.count(EM)} (hard zero)")
    if f" {EN} " in body: hard.append(f"EN DASH AS DASH x{body.count(f' {EN} ')} (hard zero)")
    if re.search(r"(?<![-\n|])--(?![-|])", body): hard.append("DOUBLE HYPHEN (hard zero)")
    scan(TELLS, low, tells)
    for name, pat in PATTERNS.items():
        n = len(re.findall(pat, body, re.I | re.M))
        if n: tells.append(f"{name.upper()} x{n}")
    rt = len(re.findall(r"\brather than\b", low))
    if rt >= 2: tells.append(f"'Y RATHER THAN X' x{rt} (reversed negative parallelism)")
    if re.search(CURLY, body) and re.search(r"[\"']", body):
        tells.append("MIXED CURLY AND STRAIGHT QUOTES")
    heads = re.findall(r"^#{1,6} (.+)$", body, re.M)
    tc = [h for h in heads if len(h.split()) >= 4 and sum(w[0].isupper() for w in h.split() if w[0].isalpha()) >= len(h.split()) - 1]
    if tc: tells.append(f"TITLE CASE HEADERS x{len(tc)} (use sentence case): {tc[:3]}")
    ch = [h for h in heads if ":" in h]
    if ch: tells.append(f"COLON HEADERS x{len(ch)}: {ch[:3]}")
    xy = [h for h in heads if re.fullmatch(r"[A-Za-z]+ (?:and|&) [A-Za-z]+", h.strip())]
    if len(xy) >= 2: tells.append(f"'X AND Y' HEADERS x{len(xy)}: {xy[:3]}")
    lines = body.splitlines()
    empty = [lines[i] for i in range(len(lines) - 1) if lines[i].startswith("#") and
             next((l for l in lines[i+1:] if l.strip()), "").startswith("#" * (len(lines[i]) - len(lines[i].lstrip("#")) + 1))]
    if empty: tells.append(f"HEADING WITH ONLY SUBHEADINGS x{len(empty)}")
    breaks = len(re.findall(r"^(?:---|\*\*\*|___)\s*$", body, re.M))
    if breaks >= 4: tells.append(f"THEMATIC BREAK BETWEEN SECTIONS x{breaks} (fine for Growth Brief essay separators)")
    wc = len(body.split()); bold = len(re.findall(r"\*\*[^*]+\*\*", body))
    if wc and bold / wc * 300 > 2: tells.append(f"BOLD DENSITY {bold} in {wc} words")
    if email and re.search(r"^#|\*\*|^\s*[-*] ", body, re.M): hard.append("MARKDOWN IN EMAIL (renders as symbols)")
    tri = len(re.findall(r"\b[\w'-]+, [\w'-]+,? and [\w'-]+\b", body))
    if wc and tri / wc * 1000 > 6: tells.append(f"RULE OF THREE {tri} in {wc} words")
    s = sentences(body)
    if len(s) >= 12:
        lens = [len(x.split()) for x in s]
        band = sum(14 <= l <= 24 for l in lens) / len(lens); short = sum(l <= 6 for l in lens) / len(lens)
        if band > 0.55: tells.append(f"SENTENCE MONOTONY {band:.0%} in the 14-24 word band")
        if short < 0.08: tells.append(f"FEW SHORT SENTENCES ({short:.0%} at 6 words or fewer)")
    scan(STYLE, low, style)
    marks = re.findall(r"\[MARK:[^\]]*\]", raw)
    if marks: print(f"note: {len(marks)} [MARK: ...] bracket(s) to list in the delivery note")
    total = len(hard) + len(tells) + len(style)
    for label, group in (("HARD (fix all)", hard), ("AI TELLS (rewrite the idea)", tells), ("HOUSE STYLE (not AI evidence)", style)):
        if group:
            print(f"{label}:"); [print("  -", f) for f in group]
    if total: print(f"{total} flag(s) in {sys.argv[1]}"); sys.exit(1)
    print(f"clean ({wc} words)")

if __name__ == "__main__": main()
