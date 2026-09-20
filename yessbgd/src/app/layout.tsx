import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://yessbangla.com"),
  title: "YESS Bangla — Business Consulting & IT Solutions in Bangladesh",
  description:
    "YESS Bangla Private Limited — international-grade business consulting, IT support, web development, OTT and e-commerce solutions in Bangladesh.",
  authors: [{ name: "YESS Bangla" }],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "YESS Bangla — Business Consulting & IT Solutions in Bangladesh",
    description:
      "YESS Bangla Private Limited — international-grade business consulting, IT support, web development, OTT and e-commerce solutions in Bangladesh.",
    type: "website",
    images: [
      {
        url: "/letterhead-header.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YESS Bangla — Business Consulting & IT Solutions in Bangladesh",
    description:
      "YESS Bangla Private Limited — international-grade business consulting, IT support, web development, OTT and e-commerce solutions in Bangladesh.",
    images: [
      "/letterhead-header.png",
    ],
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
