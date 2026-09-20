"use client";

import React, { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/hooks/useAuth";
import { LangProvider } from "@/lib/lang";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LangProvider>
            <StoreProvider>
              <Layout>{children}</Layout>
              <Toaster position="top-center" />
            </StoreProvider>
          </LangProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
