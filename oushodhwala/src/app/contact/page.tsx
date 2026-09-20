import type { Metadata } from "next";
import { ContactPage } from "@/components/ContactPage";

export const metadata: Metadata = {
  title: "যোগাযোগ | Contact Us — ঔষধওয়ালা",
  description:
    "ঔষধওয়ালার সঙ্গে যোগাযোগ করুন — ২৪/৭ হটলাইন ১৬৭০০, হোয়াটসঅ্যাপ, ইমেইল সাপোর্ট ও ঢাকার অফিস ঠিকানা।",
  openGraph: {
    title: "যোগাযোগ — ঔষধওয়ালা",
    description: "হটলাইন, হোয়াটসঅ্যাপ, ইমেইল ও অফিস ঠিকানা।",
  },
};

export default function Page() {
  return <ContactPage />;
}
