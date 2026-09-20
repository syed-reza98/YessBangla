"use client";

import { Route } from "@/routes/about.leadership";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return <Component />;
}
