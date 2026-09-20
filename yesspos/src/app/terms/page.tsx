import type { Metadata } from "next";
import { TermsPage } from "@/components/TermsPage";

export const metadata: Metadata = {
  title: "Terms of Service — Bazar Bari",
  description:
    "The agreement governing use of the Bazar Bari platform: subscriptions, billing, acceptable use, data ownership, warranties and liability.",
  openGraph: {
    title: "Terms of Service — Bazar Bari",
    description:
      "Subscription terms, acceptable use, data ownership and liability for Bazar Bari customers.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function Page() {
  return <TermsPage />;
}
