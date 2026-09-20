import type { Metadata } from "next";
import { CareersPage } from "@/components/CareersPage";

export const metadata: Metadata = {
  title: "Careers — Join YESS Bangla",
  description:
    "Apply to open roles at YESS Bangla. Select a position and submit your application in minutes.",
  openGraph: {
    title: "Careers at YESS Bangla",
    description: "Open roles in engineering, design, consulting and operations.",
  },
};

export default function Page() {
  return <CareersPage />;
}
