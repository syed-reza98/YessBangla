"use client";

import { Route } from "@/routes/industries";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return <Component />;
}
