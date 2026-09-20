import type { Metadata } from "next";
import { OffersPage } from "@/components/OffersPage";

export const metadata: Metadata = {
  title: "অফার ও ক্যাম্পেইন — ঔষধওয়ালা",
  description:
    "চলমান ডিসকাউন্ট, কুপন কোড ও ক্যাম্পেইন — ঔষধ ও স্বাস্থ্য পণ্যে সর্বোচ্চ ছাড়।",
  openGraph: {
    title: "অফার ও ক্যাম্পেইন — ঔষধওয়ালা",
    description: "সর্বোচ্চ ছাড়ে ঔষধ ও স্বাস্থ্য পণ্য কিনুন।",
  },
};

export default function Page() {
  return <OffersPage />;
}
