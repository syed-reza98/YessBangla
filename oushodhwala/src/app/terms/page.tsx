import type { Metadata } from "next";
import { TermsPage } from "@/components/TermsPage";

export const metadata: Metadata = {
  title: "শর্তাবলী | Terms of Service — ঔষধওয়ালা",
  description:
    "ঔষধওয়ালা ব্যবহারের শর্তাবলী — অ্যাকাউন্ট, প্রেসক্রিপশন ঔষধ, অর্ডার, পেমেন্ট, ডেলিভারি ও টেলিমেডিসিন সেবার নিয়মাবলী।",
  openGraph: {
    title: "শর্তাবলী — ঔষধওয়ালা",
    description: "সেবা ব্যবহারের নিয়ম ও দায়বদ্ধতা সম্পর্কে জানুন।",
  },
};

export default function Page() {
  return <TermsPage />;
}
