import type { Metadata } from "next";
import { PrivacyPage } from "@/components/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy — YESS Bangla Private Limited",
  description:
    "How YESS Bangla Private Limited collects, processes, retains and protects personal data — covering GDPR, CCPA and Bangladesh DPA principles.",
  openGraph: {
    title: "Privacy Policy — YESS Bangla",
    description:
      "Our commitments around data collection, processing, retention, security and your rights.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://yessbangla.com/privacy" },
};

export default function Page() {
  return <PrivacyPage />;
}
