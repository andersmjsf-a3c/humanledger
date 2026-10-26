# WS 0.3. What an .md file is

Read and write one plain-text file with a few symbols for headings and lists, and understand why every skill, rule, and draft on this site lives in that format. Fifteen minutes.

## Why this matters

Every skill, rule, and page in your vault is an .md file. Voice rules, the who-we-are page, the corrections log, agent job descriptions: all of them. If there's one piece of technical knowledge this site asks of you, it's this one, and it's about ten lines of symbols.

An .md file (the letters stand for Markdown) is plain text. You can open it in any program that opens text, on any computer, forever. It has no hidden formatting, no fonts, nothing that depends on one company's software staying in business. The few symbols it uses tell a reader, human or machine, where the headings are and what's a list. That's it.

The reason it matters for this work: the tool reads .md perfectly, writes it by default, and treats the structure as meaning. A heading called "Rules" is a section the tool knows to obey. A list under "Never" is a list it knows not to do. Keep what you've learned somewhere that survives the platform. This is the somewhere.

## An example

*An illustration, not a real person.* Here is the top of a skill file a solo consultant might keep for the monthly client report. The symbols are the whole lesson.

```
# Skill: Monthly client report

This skill serves [the consultant]. Use it when I say "monthly report."

## What this task is
A two-page update for one client: what was done, what it found, what's next.

## Rules
- Open with the one number the client watches.
- Every figure has a source and a date.
- Never the word "leverage."
```

One `#` is the title. Two `##` is a section heading. A line that starts with `-` is a list item. Blank lines separate paragraphs. A pair of backticks around a word shows it as code. That's five symbols, and people write hundreds of pages with no others.

Keep every .md file in one folder on your computer, sorted into subfolders by what it's for: skills, notes, logs. The folder gets backed up like anything else. When the tool changes, the folder doesn't.

## Your turn

1. **Open a plain-text editor.** On a Mac, TextEdit (set to plain text), or any code editor. On Windows, Notepad. Write the name of the one you'll use. (One line.)
   _____

2. **Write your first .md file.** Type this, with your own words, and save it as `about-me.md`:
   ```
   # About me

   ## Who I am
   One or two sentences.

   ## What I'm working on
   - First thing
   - Second thing

   ## How I like work done
   - One rule
   ```

3. **Attach it to a conversation** (Worksheet 0.2) and ask: "Read this and tell me the three section headings." If it names them, you've written a file the tool can navigate. (Yes or no.)
   _____

4. **Make your folder.** One folder for everything from this site, with subfolders: `skills`, `notes`, `logs`. Write the path. (One line.)
   _____

5. **The ten lines.** Copy this table somewhere you'll see it until you don't need it:

   | Symbol | Means |
   |---|---|
   | `# Title` | The title, once at the top |
   | `## Heading` | A section |
   | `### Smaller heading` | A subsection |
   | `- item` | A list item |
   | `1. item` | A numbered list item |
   | blank line | New paragraph |
   | `**bold**` | Bold |
   | `` `code` `` | Code or a filename |
   | `> quote` | A quoted block |
   | `[text](link)` | A link |

*How to: .md files, as of October 26, 2026. Any text editor writes them; save with the `.md` extension. The tool accepts them as attachments on every plan and writes them when you ask for "a markdown file." A skill on Claude.ai is a folder containing a file named `SKILL.md`, zipped and uploaded under Customize > Skills (Worksheet 0.5 has the steps). You don't need a special program to read one; the symbols are readable as-is.*

## Why this compounds

Every file from here on is one of these, and every one of them outlives the conversation it was made in. The `about-me.md` you just wrote is the first draft of Worksheet A1, and the folder you made is where your skills (Part B) and your agent job descriptions (Part C) will live.
