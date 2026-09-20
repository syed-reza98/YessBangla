import type { Metadata } from "next";
import { FaqPage } from "@/components/FaqPage";

export const metadata: Metadata = {
  title: "FAQ — YESS Bangla Private Limited",
  description:
    "Answers to the most common questions about YESS Bangla's services, engagement model, pricing and support.",
  openGraph: {
    title: "Frequently Asked Questions — YESS Bangla",
    description: "Everything you need to know about working with us.",
  },
};

export default function Page() {
  return <FaqPage />;
}
