"use client";

import { Route } from "@/routes/prescription.index";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return <Component />;
}
