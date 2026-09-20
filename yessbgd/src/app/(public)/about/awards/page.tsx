import type { Metadata } from "next";
import { AboutAwardsPage } from "@/components/AboutAwardsPage";

export const metadata: Metadata = {
  title: "Awards & Recognition — YESS Bangla",
  description:
    "Awards, partnerships and certifications recognising YESS Bangla's craft and delivery.",
  openGraph: {
    title: "Awards & Recognition — YESS Bangla",
    description: "A snapshot of recognition our team has earned along the way.",
  },
};

export default function Page() {
  return <AboutAwardsPage />;
}
