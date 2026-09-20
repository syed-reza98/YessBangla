import type { Metadata } from "next";
import { CategoriesPage } from "@/components/CategoriesPage";

const SITE = "https://oushodhwala.lovable.app";

export const metadata: Metadata = {
  title: "সব ক্যাটাগরি ও হোম সার্ভিস — ঔষধওয়ালা",
  description:
    "ঔষধ, ডায়াবেটিস কেয়ার, অর্থোপেডিক, ফার্স্ট এইড থেকে হোম নার্সিং ও ডাক্তার ভিজিট — সব স্বাস্থ্যসেবা হোম ডেলিভারিসহ এক জায়গায়।",
  openGraph: {
    title: "সব ক্যাটাগরি ও হোম সার্ভিস — ঔষধওয়ালা",
    description: "প্রতিটি ক্যাটাগরিতে হোম ডেলিভারি বা হোম সার্ভিস সুবিধা।",
    type: "website",
    siteName: "ঔষধওয়ালা · Oushodhwala",
    locale: "bn_BD",
    alternateLocale: "en_US",
    url: `${SITE}/categories`,
  },
  twitter: {
    card: "summary_large_image",
    title: "All categories & home services — Oushodhwala",
    description:
      "Medicines, health devices, home nursing, doctor visits and diagnostics — all with home delivery.",
  },
  alternates: {
    canonical: `${SITE}/categories`,
    languages: {
      bn: `${SITE}/categories`,
      en: `${SITE}/categories`,
      "x-default": `${SITE}/categories`,
    },
  },
};

export default function Page() {
  return <CategoriesPage />;
}
