import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer no-print">
      <div className="footer-grid container">
        <div>
          <div className="brand">
            <span className="brand-mark">OL</span>OfferLens
          </div>
          <p className="fine" style={{ maxWidth: 480, marginTop: 12 }}>
            Evidence-backed fit and compensation positioning for one opportunity. Decision
            support—not legal, financial, or employment advice.
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/methodology">Methodology</Link>
          <Link href="/data-sources">Data sources</Link>
          <Link href="/privacy">Privacy</Link>
          <a href="https://github.com/" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
