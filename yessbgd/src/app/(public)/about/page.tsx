import type { Metadata } from "next";
import { AboutPage } from "@/components/AboutPage";

export const metadata: Metadata = {
  title: "About — YESS Bangla Private Limited",
  description:
    "Learn about YESS Bangla — our mission, vision and the team behind Bangladesh's trusted consulting and IT partner.",
  openGraph: {
    title: "About YESS Bangla",
    description: "Trusted business consulting and IT partner in Bangladesh.",
  },
};

export default function Page() {
  return <AboutPage />;
}
