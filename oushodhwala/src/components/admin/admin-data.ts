"use client";

import { useQuery } from "@tanstack/react-query";
import { listAdminProductsAction } from "@/actions/admin-catalog";
import { getAdminOrdersAction } from "@/actions/orders";

export function useProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const res = await listAdminProductsAction();
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      return await getAdminOrdersAction();
    },
  });
}
