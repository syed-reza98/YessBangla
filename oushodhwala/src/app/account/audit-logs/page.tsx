"use client";

import { Route } from "@/routes/account/audit-logs";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return <Component />;
}
