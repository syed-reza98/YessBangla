import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import React from "react";

export const metadata: Metadata = {
  title: "Bazar Bari — Shop Billing, Stock & Reports",
  description:
    "Bazar Bari is a browser point-of-sale for retail shops: fast billing, automatic stock updates, daily sales reports. Bengali and English.",
  authors: [{ name: "Bazar Bari" }],
  icons: {
    icon: "/favicon.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Bazar Bari — Shop Billing, Stock & Reports",
    description:
      "Bazar Bari is a browser point-of-sale for retail shops: fast billing, automatic stock updates, daily sales reports. Bengali and English.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Outfit:wght@500;600;700;800&family=Figtree:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="app-fit min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
            {children}
          </React.Suspense>
        </Providers>
      </body>
    </html>
  );
}
