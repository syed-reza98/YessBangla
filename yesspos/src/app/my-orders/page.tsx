"use client";

import { Route } from "@/routes/my-orders";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return <Component />;
}
