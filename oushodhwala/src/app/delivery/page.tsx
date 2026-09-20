"use client";

import { Route } from "@/routes/delivery";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return <Component />;
}
