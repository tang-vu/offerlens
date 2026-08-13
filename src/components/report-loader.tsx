"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Report } from "@/domain/schemas";
import { ReportView } from "@/components/report-view";

export function ReportLoader({ id }: { id: string }) {
  const [report, setReport] = useState<Report>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void fetch(`/api/reports/${id}`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as { report?: Report; error?: string };
        if (!response.ok || !body.report) throw new Error(body.error ?? "Report not found.");
        if (active) setReport(body.report);
      })
      .catch(
        (caught: unknown) =>
          active && setError(caught instanceof Error ? caught.message : "Report not found."),
      );
    return () => {
      active = false;
    };
  }, [id]);
  if (error)
    return (
      <div className="narrow empty-page">
        <span className="eyebrow">Unavailable</span>
        <h1 className="display">This report is not here.</h1>
        <p>{error} It may have expired, been deleted, or belong to another browser session.</p>
        <Link className="button" href="/analyze">
          Start a new analysis
        </Link>
      </div>
    );
  if (!report)
    return (
      <div className="loading-state" role="status">
        <div className="loading-mark">OL</div>
        <h1>Opening your report…</h1>
        <p>Retrieving the retained structured analysis for this browser session.</p>
      </div>
    );
  return <ReportView report={report} allowDelete />;
}
