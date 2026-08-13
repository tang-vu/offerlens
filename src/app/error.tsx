"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="narrow empty-page">
      <span className="eyebrow">Unexpected error</span>
      <h1 className="display">The evidence trail broke.</h1>
      <p>
        Your source fields remain in the browser where possible. Retry the current page, or return
        to the analysis flow.
      </p>
      <button className="button" type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
