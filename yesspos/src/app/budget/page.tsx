"use client";

import { Route } from "@/routes/budget";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return <Component />;
}
