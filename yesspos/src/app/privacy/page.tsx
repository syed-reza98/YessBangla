import type { Metadata } from "next";
import { PrivacyPage } from "@/components/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Bazar Bari",
  description:
    "How Bazar Bari collects, processes, stores and protects merchant and customer data, including your rights under GDPR-aligned practices.",
  openGraph: {
    title: "Privacy Policy — Bazar Bari",
    description:
      "Data collection, processing, retention, security and your privacy rights at Bazar Bari.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function Page() {
  return <PrivacyPage />;
}
