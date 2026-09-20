import type { Metadata } from "next";
import { VenturesPage } from "@/components/VenturesPage";

export const metadata: Metadata = {
  title: "Our Ventures — YESS Bangla",
  description:
    "Explore the YESS Bangla family of ventures across software, media, agriculture, hospitality and more.",
  openGraph: {
    title: "Our Ventures — YESS Bangla",
    description:
      "A portfolio of ventures building Bangladesh's next-generation companies.",
  },
};

export default function Page() {
  return <VenturesPage />;
}
