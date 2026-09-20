// @ts-nocheck
"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listLabTestsAction, upsertLabTestAction, setLabTestActiveAction } from "@/actions/admin-catalog";
import { bn } from "@/data/catalog";
import { catalogQueryKey } from "@/lib/catalog-db";
import { WEEKDAYS } from "@/lib/appointments";
import { opsStart, opsSuccess, opsFailure } from "@/lib/ops";
import { AdminDashboard } from "@/components/AdminDashboard";
import { TestReportView } from "@/components/TestReportView";
import { emptyLab } from "@/components/admin/admin-constants";

export function LabTests() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-lab"],
    queryFn: async () => {
      const res = await listLabTestsAction();
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
  });
  const [form, setForm] = useState({ ...emptyLab });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-lab"] });
    void qc.invalidateQueries({ queryKey: catalogQueryKey });
  };

  const save = useMutation({
    mutationFn: async () => {
      const res = await upsertLabTestAction(form as unknown as Record<string, unknown>);
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("ল্যাব টেস্ট সংরক্ষিত");
      setForm({ ...emptyLab });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await setLabTestActiveAction(id, active);
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-xs text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <div>
      <div className="grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-3">
        {(["id", "bn", "en", "prep"] as const).map((k) => (
          <input
            key={k}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={{ id: "আইডি (ইউনিক)", bn: "বাংলা নাম", en: "English name", prep: "প্রস্তুতি" }[k]}
            className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
          />
        ))}
        <select
          value={form.grp}
          onChange={(e) => setForm({ ...form, grp: e.target.value })}
          className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
        >
          <option value="vital">ভাইটাল অর্গান</option>
          <option value="life_style">লাইফস্টাইল</option>
          <option value="checkup_women">নারীদের চেকআপ</option>
          <option value="checkup_men">পুরুষদের চেকআপ</option>
        </select>
        {(["price", "mrp", "sort_order"] as const).map((k) => (
          <input
            key={k}
            value={String(form[k])}
            inputMode="numeric"
            onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) || 0 })}
            placeholder={{ price: "দাম", mrp: "MRP", sort_order: "ক্রম" }[k]}
            className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
          />
        ))}
        <button
          disabled={!form.id || !form.bn || save.isPending}
          onClick={() => save.mutate()}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 sm:col-span-3"
        >
          টেস্ট যোগ / আপডেট
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {(data ?? []).map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{t.bn} <span className="text-muted-foreground">· {t.en}</span></p>
              <p className="text-[10px] text-muted-foreground">৳{bn(Number(t.price))} · {t.grp} {!t.active && "· নিষ্ক্রিয়"}</p>
            </div>
            <button
              onClick={() =>
                setForm({
                  id: t.id, bn: t.bn, en: t.en, price: Number(t.price), mrp: Number(t.mrp),
                  grp: t.grp, prep: t.prep, active: t.active, sort_order: t.sort_order,
                })
              }
              className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold"
            >
              সম্পাদনা
            </button>
            <button
              onClick={() => toggle.mutate({ id: t.id, active: !t.active })}
              className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold"
            >
              {t.active ? "বন্ধ" : "চালু"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
