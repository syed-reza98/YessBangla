import type { Metadata } from "next";
import { HelpPage } from "@/components/HelpPage";

export const metadata: Metadata = {
  title: "সহায়তা ও সাধারণ জিজ্ঞাসা — ঔষধওয়ালা",
  description:
    "অর্ডার, ডেলিভারি, পেমেন্ট ও রিটার্ন সংক্রান্ত সাধারণ প্রশ্নের উত্তর এবং যোগাযোগের মাধ্যম।",
  openGraph: {
    title: "সহায়তা ও FAQ — ঔষধওয়ালা",
    description: "২৪/৭ কাস্টমার সাপোর্ট ও সাধারণ জিজ্ঞাসার উত্তর।",
  },
};

export default function Page() {
  return <HelpPage />;
}
