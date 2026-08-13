import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header no-print">
      <div className="site-header-inner container">
        <Link className="brand" href="/">
          <span className="brand-mark">OL</span>OfferLens
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/methodology">Methodology</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/demo">View demo</Link>
          <Link className="button" href="/analyze">
            Analyze my opportunity
          </Link>
        </nav>
      </div>
    </header>
  );
}
