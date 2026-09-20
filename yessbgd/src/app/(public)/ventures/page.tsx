"use client";

import { Route } from "@/routes/ventures.index";

export default function VenturesPage() {
  const Component = Route.component as React.ComponentType;
  return <Component />;
}
