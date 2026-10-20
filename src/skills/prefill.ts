// Offers (never automatic) to copy an answer the reader already wrote in a worksheet into a skill.
// The person clicks; nothing is filled for them. tests/9-skills.test.ts checks every link still exists.
export const PREFILL = [
  { template: "2-writing-voice", fieldPrefix: "who-i-am-in-one-paragraph.", worksheet: "A1", answer: "assemble-it", label: "Use my paragraph from A1" },
  { template: "2-writing-voice", fieldPrefix: "words-and-phrases-i-never-use.", worksheet: "A3", answer: "never-say", label: "Use my “never say” line from A3" },
];
