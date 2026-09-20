"use client";

import { Route } from "@/routes/index";

export default function HomePage() {
  const Component = Route.component as React.ComponentType;
  return <Component />;
}
