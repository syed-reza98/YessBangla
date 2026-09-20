import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";

export const metadata: Metadata = {
  title: "YESS Bangla — Business Consulting & IT Solutions",
  description:
    "International-grade business consulting, IT, OTT, e-commerce and web solutions in Bangladesh.",
  openGraph: {
    title: "YESS Bangla — Business Consulting & IT Solutions",
    description: "We help businesses across Bangladesh reach the next level.",
  },
};

export default function Page() {
  return <HomePage />;
}
