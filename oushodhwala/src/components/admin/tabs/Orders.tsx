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

import { STATUS } from "@/components/admin/admin-constants";
import { adminSetOrderStatusAction } from "@/actions/orders";

export function Orders() {
  const qc = useQueryClient();
  const { data, isLoading } = useOrders();
  const [filter, setFilter] = useState("all");

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      opsStart("order_status_change", { orderId: id, status });
      const res = await adminSetOrderStatusAction(id, status);
      if (!res.ok) {
        opsFailure("order_status_change", new Error(res.error), { orderId: id, status });
        throw new Error(res.error);
      }
      opsSuccess("order_status_change", id, { status });
    },
    onSuccess: () => {
      toast.success("অর্ডার আপডেট হয়েছে — গ্রাহককে নোটিফিকেশন পাঠানো হয়েছে");
      void qc.invalidateQueries({ queryKey: ["admin-orders"] });
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-xs text-muted-foreground">লোড হচ্ছে...</p>;
  const list = (data ?? []).filter((o) => filter === "all" || o.status === filter);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", ...Object.keys(STATUS)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
              filter === s ? "border-primary text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {s === "all" ? "সব" : STATUS[s]}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="text-xs text-muted-foreground">কোনো অর্ডার নেই।</p>}
      <div className="space-y-2">
        {list.map((o) => (
          <article key={o.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold">#{o.order_no}</p>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">{STATUS[o.status] ?? o.status}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px]">
                {o.payment_method.toUpperCase()} · {o.payment_status === "paid" ? "পরিশোধিত" : "বাকি"}
              </span>
              <p className="ml-auto text-sm font-bold text-primary-dark">৳{bn(Math.round(Number(o.total)))}</p>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {o.customer_name} · {o.phone} · {o.address}
            </p>
            <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleString("bn-BD")} · {o.slot}</p>
            <ul className="mt-2 space-y-0.5 text-[11px]">
              {(o.order_items ?? []).map((i: any) => (
                <li key={i.id} className="flex justify-between">
                  <span className="text-muted-foreground">{i.name} × {bn(i.qty)}</span>
                  <span>৳{bn(Math.round(Number(i.price) * i.qty))}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(STATUS).map(([k, label]) => (
                <button
                  key={k}
                  disabled={o.status === k || setStatus.isPending}
                  onClick={() => setStatus.mutate({ id: o.id, status: k })}
                  className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold disabled:opacity-40"
                >
                  {label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
