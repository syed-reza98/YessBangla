"use client";

import { Route } from "@/routes/_authenticated/journal";
import { AppShell } from "@/components/AppShell";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return (
    <AppShell>
      <Component />
    </AppShell>
  );
}
