import { GLOSSARY } from "@/service";

export const metadata = { title: "Glossary", description: "Every term in one or two sentences you can repeat out loud." };

export default function Glossary() {
  return (
    <main>
      <h1>Glossary</h1>
      <p className="lede">
        One or two sentences each, in plain words. No jargon in the definition of jargon. Retired names stay, with a note, so an
        old article doesn&apos;t make you think you&apos;re the one who&apos;s confused.
      </p>
      <dl className="glossary">
        {GLOSSARY.map((t) => (
          <div key={t.slug} id={t.slug}>
            <dt>{t.term}</dt>
            <dd dangerouslySetInnerHTML={{ __html: t.definitionHtml }} />
          </div>
        ))}
      </dl>
      <p className="meta">
        A word you keep meeting isn&apos;t here? It goes in when it earns a place, with a date. <a href="/do/understand-a-word">How to use this page</a>.
      </p>
    </main>
  );
}
