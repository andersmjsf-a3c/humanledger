---
name: check-the-facts
description: Runs a fact-check pass on any draft that contains a number, a name, a date, a quote, or a claim about what someone said or a rule requires, before I read it. Use when I say "check this," "fact-check," or before any draft of mine goes out.
---

# Check the facts before I send

This skill serves me. Run it on anything I'm about to send that contains a number, a name, a date, a quote, or a claim about what a source says. Run it again after I edit.

## What I send that has to be right
{{kinds}}

## What a wrong fact costs me
{{cost}} Be as careful as that cost deserves.

## Check every one of these
1. Numbers. Each has a named source and a date, in the text or in a note. "Industry data" is not a source. Flag any that don't.
2. The one that matters. Name the number the argument turns on. Find a second source for it. Say whether the two agree.
3. Names and titles. Current and spelled right. Search for each one. Flag anyone whose title may have changed.
4. Dates. Correct, and consistent with each other and with the sources.
5. Quotes. Found word for word in the source they're attributed to. Under fifteen words. A quote you can't find becomes a paraphrase, attributed.
6. Arithmetic. Show the formula and the inputs. Add it up.
7. "Said," "reported," "requires." The source actually says that, not something adjacent.
8. Something it has gotten almost right for me before: {{burned}}

## Output
A short table: item · status (confirmed / close but wrong / couldn't find) · source opened · what to change.
Then one line beginning "Couldn't verify:" listing whatever is left. There is almost always at least one item.
Then the draft with only the flagged items changed, changes marked.

## Rules
- "Couldn't find" is a valid answer. Never upgrade it to "confirmed" to be helpful.
- Don't rewrite anything except the flagged items.
- Don't round, and don't pick the more impressive of two numbers.
- Any source you can't open is not a source.
- Search the web before checking anything that could have changed since you were trained.

## Corrections (add a line here every time a reader catches something the pass missed)
- 
