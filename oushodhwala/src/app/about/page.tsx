import type { Metadata } from "next";
import { AboutPage } from "@/components/AboutPage";

export const metadata: Metadata = {
  title: "আমাদের সম্পর্কে — ঔষধওয়ালা অনলাইন ফার্মেসি",
  description:
    "ঔষধওয়ালা বাংলাদেশের বিশ্বস্ত অনলাইন ফার্মেসি — ১০০% অরিজিনাল ঔষধ, লাইসেন্সপ্রাপ্ত ফার্মাসিস্ট টিম ও দ্রুত হোম ডেলিভারি।",
  openGraph: {
    title: "আমাদের সম্পর্কে — ঔষধওয়ালা",
    description: "আমাদের মিশন: নিরাপদ ও সাশ্রয়ী ঔষধ সবার ঘরে পৌঁছে দেওয়া।",
  },
};

export default function Page() {
  return <AboutPage />;
}
