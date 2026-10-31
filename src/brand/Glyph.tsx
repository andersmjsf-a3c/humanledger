// Draft mark (glyph A, Oct 31 2026): a hull in section. Deck, keel-green waterline, round hull,
// fin keel, in a band of sea-green water. Draft until the trademark screen; vectors come after.
export function Glyph({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden="true" className="glyph">
      <rect x="6" y="31" width="60" height="30" rx="4" fill="#DCE9E3" />
      <rect x="19" y="23" width="34" height="7" rx="1.5" fill="#17201F" />
      <line x1="10" y1="31" x2="62" y2="31" stroke="#1F5F4A" strokeWidth="3" strokeLinecap="round" />
      <path d="M17 33 Q36 50 55 33 Z" fill="#17201F" />
      <path d="M32 44 L40 44 L38 62 L34 62 Z" fill="#17201F" />
    </svg>
  );
}
