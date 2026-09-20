import type { Metadata } from "next";
import { PrivacyPage } from "@/components/PrivacyPage";

export const metadata: Metadata = {
  title: "গোপনীয়তা নীতি | Privacy Policy — ঔষধওয়ালা",
  description:
    "ঔষধওয়ালা কীভাবে আপনার ব্যক্তিগত তথ্য, প্রেসক্রিপশন ও স্বাস্থ্য ডেটা সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখে — সম্পূর্ণ গোপনীয়তা নীতি।",
  openGraph: {
    title: "গোপনীয়তা নীতি — ঔষধওয়ালা",
    description: "আপনার স্বাস্থ্য ডেটা কীভাবে সুরক্ষিত রাখা হয় তা জানুন।",
  },
};

export default function Page() {
  return <PrivacyPage />;
}
