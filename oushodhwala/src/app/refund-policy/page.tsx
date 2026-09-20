import type { Metadata } from "next";
import { RefundPolicyPage } from "@/components/RefundPolicyPage";

export const metadata: Metadata = {
  title: "রিটার্ন ও রিফান্ড নীতি | Return & Refund — ঔষধওয়ালা",
  description:
    "ঔষধওয়ালার রিটার্ন ও রিফান্ড নীতি — কোন পণ্য ফেরত দেওয়া যায়, কত দিনের মধ্যে, এবং bKash/Nagad/কার্ডে টাকা ফেরতের সময়সীমা।",
  openGraph: {
    title: "রিটার্ন ও রিফান্ড নীতি — ঔষধওয়ালা",
    description: "পণ্য ফেরত ও অর্থ ফেরতের সম্পূর্ণ নিয়ম।",
  },
};

export default function Page() {
  return <RefundPolicyPage />;
}
