import { PRODUCT_NAME } from "@/config/brand";
import { AccountNav } from "@/account/AccountNav";
import { PrivacyLink } from "@/account/PrivacyLink";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="/">
        {PRODUCT_NAME}
        <span className="beta">Beta</span>
      </a>
      <nav aria-label="Main">
        <AccountNav part="lead" />
        <a href="/#starters">Starters</a>
        <a href="/#how">How it works</a>
        <a href="/#confusing">When something&apos;s confusing</a>
      </nav>
      <AccountNav part="button" />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer-band">
      <div className="site-footer">
      <span>{PRODUCT_NAME} · Helping every person lead AI, keep what they learn, and build on it.</span>
      <div className="links">
        <PrivacyLink />
        <a href="/glossary">Glossary</a>
        <a href="/grader">Grade your work</a>
        <a href="/history">Your history</a>
      </div>
      </div>
    </footer>
  );
}
