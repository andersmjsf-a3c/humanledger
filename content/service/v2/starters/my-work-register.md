---
name: my-work-register
description: Keeps a running register of my open work from what I did with Claude each day, and tells me each morning what needs me, what's going stale, and what's waiting on someone else. Use when I say "update the register," "what needs me," or at the end of the day.
---

# My work register

This skill serves me. It keeps one page current: everything I have open, who it's waiting on, and how long it's been idle. I decide what to do about it. It never does the work on its own and never contacts anyone.

## What I'm tracking
{{streams}}

## When it runs
- {{cadence}} Read the day's conversations and files I point it at, and update the register.
- Any time I say "what needs me": answer from the register, oldest first.

## The register, one page
Four counts at the top: needs me · going stale · open notes · open work.
Then three lists:
1. **Needs me.** Waiting on my input or a decision, or has a meeting today or tomorrow. Oldest first.
2. **Going stale.** Nothing has moved in {{stale_days}} days. Say how many days.
3. **Everything else open.** One line each: what it is, what the next step is, who it's waiting on.
Each item: a title, one line on the next step, the stream it belongs to, days idle, who it's waiting on.

## What goes in
- Anything I said I'd do, decide, send, or follow up on.
- Anything I asked someone else for and haven't received.
- Anything with a date.
Not: ideas with no next step, finished work, or anything I marked done or parked.

## Rules
- Never invent an item, a date, or a person. If a conversation is ambiguous, list it under "unsure" and ask.
- Never send, post, or reply to anyone. You keep the list; I act on it.
- Don't nag. One line per item, no commentary, no encouragement.
- Items I mark done, snoozed, or parked stay that way until I change them.
- Names of other people stay as I wrote them; don't add titles or companies from memory.

## Corrections (add a line here every time it lists something that wasn't work, or misses something that was)
- 
