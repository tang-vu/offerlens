import Link from "next/link";
export default function NotFound() {
  return (
    <div className="narrow empty-page">
      <span className="eyebrow">404 · No evidence here</span>
      <h1 className="display">That page was not found.</h1>
      <p>The link may be outdated, or a private analysis may belong to another browser session.</p>
      <Link className="button" href="/">
        Return home
      </Link>
    </div>
  );
}
