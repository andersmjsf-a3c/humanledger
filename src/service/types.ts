// The content front end (rings 1 and 2): eight "What are you trying to do?" pages and the glossary.
// Source: the human-led-service skill's references (content-do-pages/, glossary.md), copied unchanged
// into content/service/. Company voice, second person, no founder stories.

export type PromptPart = { text: string } | { blank: string };

export interface TryIt {
  beforeHtml: string; // instructions above the paste-ready prompt
  prompt: PromptPart[]; // the prompt, with [blanks] the reader fills in on the page
  afterHtml: string; // what to do with the answer
}

export interface DoSection {
  heading: string;
  html: string;
}

export interface DoPage {
  n: number;
  slug: string;
  title: string;
  summary: string;
  worksheets: string[]; // workbook codes the Keep this button opens, first one primary
  glossary: string[]; // glossary slugs to link, or ["all"]
  persona: string;
  ruleHtml: string;
  tryIt: TryIt;
  sections: DoSection[]; // everything after Try it now except Keep this, in order
  keepHtml: string;
  source: string;
}

export interface GlossaryTerm {
  slug: string;
  term: string;
  definitionHtml: string;
  definitionText: string;
}
