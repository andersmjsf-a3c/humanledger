import { notFound } from "next/navigation";
import { DO_PAGES, pageBySlug, termBySlug } from "@/service";
import { TryIt } from "@/service/TryIt";
import { KeepThis } from "@/service/KeepThis";

export function generateStaticParams() {
  return DO_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = pageBySlug((await params).slug);
  return p ? { title: p.title, description: p.summary } : {};
}

// HTML here comes from the content files in this repo at build time, never from a visitor.
const Html = ({ html }: { html: string }) => <div dangerouslySetInnerHTML={{ __html: html }} />;

export default async function DoPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = pageBySlug((await params).slug);
  if (!page) notFound();
  const terms = page.glossary.includes("all") ? [] : page.glossary.map(termBySlug).filter((t) => !!t);

  return (
    <main className="dopage">
      <p className="crumb">
        <a href="/#do">What are you trying to do?</a>
      </p>
      <h1>{page.title}</h1>
      <p className="lede">{page.summary}</p>

      <h2>The rule</h2>
      <Html html={page.ruleHtml} />

      <h2>Try it now</h2>
      <Html html={page.tryIt.beforeHtml} />
      <TryIt slug={page.slug} parts={page.tryIt.prompt} />
      <Html html={page.tryIt.afterHtml} />

      {page.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          <Html html={s.html} />
        </section>
      ))}

      <h2>Keep this</h2>
      <Html html={page.keepHtml} />
      <KeepThis slug={page.slug} title={page.title} codes={page.worksheets} parts={page.tryIt.prompt} />

      {terms.length > 0 && (
        <p className="meta terms">
          Words on this page:{" "}
          {terms.map((t, i) => (
            <span key={t!.slug}>
              {i > 0 && ", "}
              <a href={`/glossary#${t!.slug}`}>{t!.term}</a>
            </span>
          ))}
        </p>
      )}
    </main>
  );
}
