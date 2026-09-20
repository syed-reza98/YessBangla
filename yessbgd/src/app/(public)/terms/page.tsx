import type { Metadata } from "next";
import { TermsPage } from "@/components/TermsPage";

export const metadata: Metadata = {
  title: "Terms of Service — YESS Bangla Private Limited",
  description:
    "Terms governing the use of YESS Bangla's website, services, deliverables, payments, warranties and dispute resolution.",
  openGraph: {
    title: "Terms of Service — YESS Bangla",
    description:
      "The agreement between you and YESS Bangla Private Limited when using our website or engaging us for services.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://yessbangla.com/terms" },
};

export default function Page() {
  return <TermsPage />;
}
