import type { Metadata } from "next";
import { IndustriesPage } from "@/components/IndustriesPage";

export const metadata: Metadata = {
  title: "Industries — YESS Bangla Private Limited",
  description:
    "Industries we serve: media, retail, education, healthcare, finance, manufacturing, logistics and government in Bangladesh.",
  openGraph: {
    title: "Industries we serve — YESS Bangla",
    description: "Cross-industry consulting and IT solutions delivered nation-wide.",
  },
};

export default function Page() {
  return <IndustriesPage />;
}
