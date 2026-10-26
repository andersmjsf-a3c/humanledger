import { PRODUCT_NAME } from "@/config/brand";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="/">
        {PRODUCT_NAME}
      </a>
      <nav aria-label="Main">
        <a href="/#do">What are you trying to do?</a>
        <a href="/glossary">Glossary</a>
        <a href="/where-things-live">Where things live</a>
        <a href="/what-changed">What changed</a>
      </nav>
      <a className="btn-quiet" href="/login">
        Sign in
      </a>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer-band">
      <div className="site-footer">
      <span>{PRODUCT_NAME}</span>
      <div className="links">
        <a href="/privacy">Privacy: what leaves your vault</a>
        <a href="/glossary">Glossary</a>
        <a href="/grader">Grade your work</a>
        <a href="/history">Your history</a>
      </div>
      </div>
    </footer>
  );
}
