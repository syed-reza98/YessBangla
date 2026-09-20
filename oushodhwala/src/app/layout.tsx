import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import React from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ঔষধওয়ালা — অনলাইন ফার্মেসি | Oushodhwala",
  description:
    "ঔষধওয়ালা থেকে অরিজিনাল ঔষধ, স্বাস্থ্য পণ্য ও ল্যাব টেস্ট অর্ডার করুন। ঢাকায় ২ ঘণ্টায় ডেলিভারি, সারাদেশে ২৪-৭২ ঘণ্টায়।",
  authors: [{ name: "Oushodhwala" }],
  icons: {
    icon: "/favicon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "ঔষধওয়ালা — অনলাইন ফার্মেসি | Oushodhwala",
    description:
      "ঔষধওয়ালা থেকে অরিজিনাল ঔষধ, স্বাস্থ্য পণ্য ও ল্যাব টেস্ট অর্ডার করুন। ঢাকায় ২ ঘণ্টায় ডেলিভারি, সারাদেশে ২৪-৭২ ঘণ্টায়।",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Urbanist:wght@500;600;700;800;900&family=Epilogue:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <Providers>
          <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
            {children}
          </React.Suspense>
        </Providers>
      </body>
    </html>
  );
}
