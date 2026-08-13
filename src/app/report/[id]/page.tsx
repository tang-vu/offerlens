import type { Metadata } from "next";
import { ReportLoader } from "@/components/report-loader";

export const metadata: Metadata = {
  title: "Job Fit Report",
  robots: { index: false, follow: false },
};
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportLoader id={id} />;
}
