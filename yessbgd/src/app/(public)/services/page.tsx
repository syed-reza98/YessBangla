import type { Metadata } from "next";
import { ServicesPage } from "@/components/ServicesPage";

export const metadata: Metadata = {
  title: "Services & Pricing — YESS Bangla",
  description:
    "Business consulting, IT, OTT, web and e-commerce services with transparent engagement models. Free consultation in 24 hours.",
  openGraph: {
    title: "Services & Pricing — YESS Bangla",
    description:
      "Consulting, IT, OTT, web and e-commerce — built for ambitious businesses.",
  },
};

export default function Page() {
  return <ServicesPage />;
}
