"use client";

import { Route } from "@/routes/ventures.$slug";

export default function VentureDetailPage() {
  const Component = Route.component as React.ComponentType;
  return <Component />;
}
