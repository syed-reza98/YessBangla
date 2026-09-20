"use client";

import { Route } from "@/routes/reset-password";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return <Component />;
}
