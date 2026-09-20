"use client";

import { Route } from "@/routes/book-doctor.$id";

export default function Page() {
  const Component = (Route as any).component as React.ComponentType;
  return <Component />;
}
