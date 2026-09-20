import type { Metadata } from "next";
import { TrackPage } from "@/components/TrackPage";

export const metadata: Metadata = {
  title: "Track your grocery order — Bazar Bari",
  description:
    "Check the live status of your home delivery grocery order with order number and phone.",
  openGraph: {
    title: "Track your grocery order — Bazar Bari",
    description: "Live status of your home delivery order.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function Page() {
  return <TrackPage />;
}
