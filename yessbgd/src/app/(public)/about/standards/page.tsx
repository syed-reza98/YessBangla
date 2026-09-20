import type { Metadata } from "next";
import { AboutStandardsPage } from "@/components/AboutStandardsPage";

export const metadata: Metadata = {
  title: "International Standards — YESS Bangla",
  description:
    "How YESS Bangla is operated to international quality, security and delivery standards.",
  openGraph: {
    title: "International Standards — YESS Bangla",
    description:
      "ISO-aligned processes, senior-led delivery, 24/5 support and more.",
  },
};

export default function Page() {
  return <AboutStandardsPage />;
}
