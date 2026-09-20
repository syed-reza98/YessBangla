import type { Metadata } from "next";
import { ContactPage } from "@/components/ContactPage";

export const metadata: Metadata = {
  title: "Contact — YESS Bangla",
  description:
    "Get in touch with YESS Bangla Private Limited — Mirpur, Dhaka. Phone, email and inquiry form.",
  openGraph: {
    title: "Contact YESS Bangla",
    description: "Reach our team in Mirpur, Dhaka.",
  },
};

export default function Page() {
  return <ContactPage />;
}
