// @ts-nocheck
"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listOffersAction, upsertOfferAction, setOfferActiveAction } from "@/actions/admin-catalog";
import { bn } from "@/data/catalog";
import { catalogQueryKey } from "@/lib/catalog-db";
import { WEEKDAYS } from "@/lib/appointments";
import { opsStart, opsSuccess, opsFailure } from "@/lib/ops";
import { AdminDashboard } from "@/components/AdminDashboard";
import { TestReportView } from "@/components/TestReportView";

export function Offers() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => {
      const res = await listOffersAction();
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
  });
  const [form, setForm] = useState({
    code: "",
    title: "",
    subtitle: "",
    emoji: "🎟️",
    discount_pct: 10,
    min_order: 0,
    max_discount: 200,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-offers"] });
    void qc.invalidateQueries({ queryKey: catalogQueryKey });
  };

  const add = useMutation({
    mutationFn: async () => {
      const res = await upsertOfferAction({ ...form, active: true });
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("অফার সংরক্ষিত");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await setOfferActiveAction(id, active);
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-xs text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <div>
      <div className="grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-3">
        {(["code", "title", "subtitle", "emoji"] as const).map((k) => (
          <input
            key={k}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={{ code: "কুপন কোড", title: "শিরোনাম", subtitle: "বিবরণ", emoji: "ইমোজি" }[k]}
            className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
          />
        ))}
        {(["discount_pct", "min_order", "max_discount"] as const).map((k) => (
          <input
            key={k}
            value={String(form[k])}
            inputMode="numeric"
            onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) || 0 })}
            placeholder={{ discount_pct: "ছাড় %", min_order: "সর্বনিম্ন অর্ডার", max_discount: "সর্বোচ্চ ছাড়" }[k]}
            className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
          />
        ))}
        <button
          disabled={!form.code || !form.title}
          onClick={() => add.mutate()}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 sm:col-span-3"
        >
          অফার যোগ / আপডেট
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {(data ?? []).map((o) => (
          <div key={o.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
            <span className="text-lg">{o.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{o.code} — {o.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {bn(Number(o.discount_pct))}% · সর্বনিম্ন ৳{bn(Number(o.min_order))} · সর্বোচ্চ ৳{bn(Number(o.max_discount))}
              </p>
            </div>
            <button
              onClick={() => toggle.mutate({ id: o.id, active: !o.active })}
              className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold"
            >
              {o.active ? "বন্ধ" : "চালু"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
