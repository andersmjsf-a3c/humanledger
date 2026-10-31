import { PRODUCT_NAME } from "@/config/brand";

export const metadata = { title: `Why ${PRODUCT_NAME}` };

// keelsound-brand messaging.md, About. No founder, no team page in beta.
const FOR = [
  "A solo consultant",
  "The owner of a small professional practice",
  "A sales manager at a mid-sized company",
  "A nonprofit director",
  "A first-year founder",
  "A high-school teacher",
];

export default function About() {
  return (
    <main className="about">
      <h1>Why {PRODUCT_NAME}.</h1>
      <p className="lede">
        The keel is the part of a boat you don&apos;t see. It&apos;s what lets you sail into the wind without going over, and you
        still hold the tiller. Sound, as in a sound hull: nothing gets in, nothing leaks out. And a sounding is the depth check a
        sailor takes. {PRODUCT_NAME} can&apos;t read a word you write. It keeps what you know about your own work and brings it with
        you into every new model.
      </p>
      <p className="mission">Helping every person lead AI, keep what they learn, and build on it.</p>
      <h2>Who it&apos;s for</h2>
      <ul className="steps">
        {FOR.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </main>
  );
}
