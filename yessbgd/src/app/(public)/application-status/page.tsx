import type { Metadata } from "next";
import { ApplicationStatusPage } from "@/components/ApplicationStatusPage";

export const metadata: Metadata = {
  title: "Application status — YESS Bangla",
  description:
    "Track your job application status with your reference ID and email.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ ref?: string; email?: string }>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  return (
    <ApplicationStatusPage
      initialRef={typeof sp.ref === "string" ? sp.ref : undefined}
      initialEmail={typeof sp.email === "string" ? sp.email : undefined}
    />
  );
}
