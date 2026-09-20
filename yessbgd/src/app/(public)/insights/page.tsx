import type { Metadata } from "next";
import { InsightsPage } from "@/components/InsightsPage";

export const metadata: Metadata = {
  title: "Insights & Blog — YESS Bangla",
  description:
    "Articles, case studies and industry insights from YESS Bangla's consultants and engineers.",
  openGraph: {
    title: "Insights — YESS Bangla",
    description: "Latest thinking on business strategy and technology in Bangladesh.",
    type: "website",
    url: "https://yessbangla.com/insights",
  },
  alternates: { canonical: "https://yessbangla.com/insights" },
};

export default function Page() {
  return <InsightsPage />;
}
