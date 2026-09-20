import type { Metadata } from "next";
import { AboutMethodologyPage } from "@/components/AboutMethodologyPage";

export const metadata: Metadata = {
  title: "Our Methodology — YESS Bangla",
  description:
    "Discover, Design, Deliver, Support — the proven 4-step methodology behind every YESS Bangla engagement.",
  openGraph: {
    title: "Our Methodology — YESS Bangla",
    description:
      "A proven 4-step delivery methodology: Discover, Design, Deliver, Support.",
  },
};

export default function Page() {
  return <AboutMethodologyPage />;
}
