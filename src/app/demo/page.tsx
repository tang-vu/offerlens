import type { Metadata } from "next";
import { createDemoReport } from "@/domain/demo";
import { ReportView } from "@/components/report-view";

export const metadata: Metadata = {
  title: "Demo Job Fit Report",
  description:
    "Explore a complete OfferLens report made from clearly synthetic candidate, job, GitHub, and salary data.",
};
export default async function DemoPage() {
  return <ReportView report={await createDemoReport()} />;
}
