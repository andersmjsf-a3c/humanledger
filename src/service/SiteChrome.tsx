import { PRODUCT_NAME } from "@/config/brand";
import { AccountNav } from "@/account/AccountNav";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="/">
        {PRODUCT_NAME}
      </a>
      <nav aria-label="Main">
        <AccountNav part="lead" />
        <a href="/glossary">Glossary</a>
        <a href="/where-things-live">Where things live</a>
        <a href="/what-changed">What changed</a>
      </nav>
      <AccountNav part="button" />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer-band">
      <div className="site-footer">
      <span>{PRODUCT_NAME}</span>
      <div className="links">
        <a href="/privacy">Privacy: what leaves your vault (scores only)</a>
        <a href="/glossary">Glossary</a>
        <a href="/grader">Grade your work</a>
        <a href="/history">Your history</a>
      </div>
      </div>
    </footer>
  );
}
