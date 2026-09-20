"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bn } from "@/data/catalog";
import { catalogQueryKey } from "@/lib/catalog-db";
import { WEEKDAYS } from "@/lib/appointments";
import { opsStart, opsSuccess, opsFailure } from "@/lib/ops";
import { AdminDashboard } from "@/components/AdminDashboard";
import { TestReportView } from "@/components/TestReportView";
import { useProducts, useOrders } from "@/components/admin/admin-data";

export function Dashboard() {
  const products = useProducts();
  const orders = useOrders();
  return (
    <AdminDashboard
      orders={(orders.data ?? []) as never[]}
      products={(products.data ?? []) as never[]}
      loading={orders.isLoading || products.isLoading}
    />
  );
}

/* ---------------- orders ---------------- */
