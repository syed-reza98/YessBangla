"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { applyHeaderFooterCssVars, loadLogoSettings } from "@/lib/logoSettings";
import { applyIntensity, loadIntensity, applyPalette, loadPalette } from "@/lib/liquidGlass";
import "@/i18n";
import { useTranslation } from "react-i18next";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 60_000,
          },
        },
      })
  );

  const { i18n } = useTranslation();

  useEffect(() => {
    applyHeaderFooterCssVars(loadLogoSettings());
    applyIntensity(loadIntensity());
    applyPalette(loadPalette());
  }, []);

  useEffect(() => {
    const lang = i18n.resolvedLanguage || i18n.language || "en";
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [i18n.resolvedLanguage, i18n.language]);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </SessionProvider>
  );
}
