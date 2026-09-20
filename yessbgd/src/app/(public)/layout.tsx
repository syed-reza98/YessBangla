"use client";

import React from "react";
import { WaterBackground } from "@/components/WaterBackground";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollUpDown } from "@/components/ScrollUpDown";
import { LiquidGlassToggle } from "@/components/LiquidGlassToggle";
import { MobileTabBar } from "@/components/MobileTabBar";
import { RouteTransition } from "@/components/RouteTransition";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={<div className="min-h-screen" />}>
      <div className="relative flex min-h-screen flex-col app-shell">
        <WaterBackground />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          <RouteTransition>{children}</RouteTransition>
        </main>
        <Footer />
        <ScrollUpDown />
        <LiquidGlassToggle />
        <MobileTabBar />
      </div>
    </React.Suspense>
  );
}
