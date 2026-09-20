"use client";

import { Route } from "@/routes/_authenticated/catalog";
import { AppShell } from "@/components/AppShell";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return (
    <AppShell>
      <Component />
    </AppShell>
  );
}
