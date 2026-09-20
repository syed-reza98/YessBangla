"use client";

import { Route } from "@/routes/rx.$id";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return <Component />;
}
