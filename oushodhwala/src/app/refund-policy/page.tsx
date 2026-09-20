"use client";

import { Route } from "@/routes/refund-policy";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return <Component />;
}
