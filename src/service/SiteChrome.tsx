import { PRODUCT_NAME } from "@/config/brand";
import { AccountNav } from "@/account/AccountNav";
import { Glyph } from "@/brand/Glyph";
import { FooterSignIn, PrivacyLink } from "@/account/PrivacyLink";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="lockup" href="/">
        <Glyph />
        <span className="brand">
          {PRODUCT_NAME}
          <span className="beta">Beta</span>
        </span>
      </a>
      <nav aria-label="Main">
        <AccountNav part="lead" />
        <a href="/#starters">Starter Skills</a>
        <a href="/glossary">Glossary</a>
        <a href="/where-things-live">Where things live</a>
        <a href="/what-changed">What changed</a>
        <a href="/about">About</a>
      </nav>
      <AccountNav part="button" />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer-band">
      <div className="site-footer">
        <span>
          <PrivacyLink />. <a href="/privacy">The complete list</a>.
        </span>
        <div className="links">
          <a href="/glossary">Glossary</a>
          <a href="/where-things-live">Where things live</a>
          <a href="/what-changed">What changed</a>
          <a href="/about">About</a>
          <FooterSignIn />
        </div>
        <span>{PRODUCT_NAME} · Beta</span>
      </div>
    </footer>
  );
}
