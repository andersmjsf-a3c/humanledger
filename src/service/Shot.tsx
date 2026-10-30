import { SCREENSHOTS_TAKEN, type Screenshot } from "./screenshots";

const taken = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

// A real screen, dated like the Where things live rows. Names and titles in it were changed.
export function Shot({ s, small }: { s: Screenshot; small?: boolean }) {
  return (
    <figure className={`shot ${small ? "small" : ""}`}>
      <a href={`/screenshots/${s.file}`}>
        <img src={`/screenshots/${s.file}`} alt={s.alt} loading="lazy" />
      </a>
      <figcaption>
        {s.caption} <span className="meta">Screen from {taken(SCREENSHOTS_TAKEN)}; names and titles changed.</span>
      </figcaption>
    </figure>
  );
}

export function Shots({ list, small }: { list: Screenshot[]; small?: boolean }) {
  return list.length ? (
    <>
      {list.map((s) => (
        <Shot key={s.file} s={s} small={small} />
      ))}
    </>
  ) : null;
}
