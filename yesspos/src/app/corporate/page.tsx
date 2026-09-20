import type { Metadata } from "next";
import { CorporatePage } from "@/components/CorporatePage";

const SITE = "https://yesspos.lovable.app";

export const metadata: Metadata = {
  title: "Corporate & bulk supply — Bazar Bari",
  description:
    "Bazar Bari corporate desk: monthly grocery supply, pantry restocking and invoiced bulk orders for offices, factories and institutions in Bangladesh.",
  openGraph: {
    title: "Corporate & bulk supply — Bazar Bari",
    description:
      "Invoiced bulk grocery supply and pantry management for offices and institutions.",
    type: "website",
    url: `${SITE}/corporate`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Corporate & bulk supply — Bazar Bari",
    description:
      "Invoiced bulk grocery supply and pantry management for offices and institutions.",
  },
  alternates: { canonical: `${SITE}/corporate` },
};

export default function Page() {
  return <CorporatePage />;
}
