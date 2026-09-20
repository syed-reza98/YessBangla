"use client";

import { Route } from "@/routes/_authenticated/stock-adjustments";
import { AppShell } from "@/components/AppShell";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return (
    <AppShell>
      <Component />
    </AppShell>
  );
}
