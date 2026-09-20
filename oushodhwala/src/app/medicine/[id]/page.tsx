"use client";

import { Route } from "@/routes/medicine.$id";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return <Component />;
}
