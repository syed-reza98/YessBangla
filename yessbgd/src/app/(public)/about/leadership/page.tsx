import type { Metadata } from "next";
import { AboutLeadershipPage } from "@/components/AboutLeadershipPage";

export const metadata: Metadata = {
  title: "Leadership — YESS Bangla",
  description:
    "Meet the leadership team behind YESS Bangla — strategists, engineers and designers united by craft.",
  openGraph: {
    title: "Leadership — YESS Bangla",
    description: "Meet the people leading YESS Bangla.",
  },
};

export default function Page() {
  return <AboutLeadershipPage />;
}
