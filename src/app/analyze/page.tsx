import type { Metadata } from "next";
import { AnalysisWizard } from "@/components/analysis-wizard";

export const metadata: Metadata = {
  title: "Analyze an opportunity",
  description:
    "Upload or paste your evidence, review extracted facts, and generate an explainable OfferLens report.",
};

export default function AnalyzePage() {
  return (
    <div className="container">
      <AnalysisWizard />
    </div>
  );
}
