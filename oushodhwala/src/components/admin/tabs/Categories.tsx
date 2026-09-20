"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listCategoriesAction, upsertCategoryAction, setCategoryActiveAction } from "@/actions/admin-catalog";
import { bn } from "@/data/catalog";
import { catalogQueryKey } from "@/lib/catalog-db";
import { WEEKDAYS } from "@/lib/appointments";
import { opsStart, opsSuccess, opsFailure } from "@/lib/ops";
import { AdminDashboard } from "@/components/AdminDashboard";
import { TestReportView } from "@/components/TestReportView";

export function Categories() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await listCategoriesAction();
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
  });
  const [form, setForm] = useState({
    slug: "",
    bn: "",
    en: "",
    emoji: "🧴",
    description: "",
    description_en: "",
    kind: "product",
    home_delivery: true,
    home_service: false,
    service_route: "",
    eta: "",
    eta_en: "",
    base_fee: 0,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-categories"] });
    void qc.invalidateQueries({ queryKey: catalogQueryKey });
  };

  const add = useMutation({
    mutationFn: async () => {
      const res = await upsertCategoryAction({ ...form, active: true });
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("ক্যাটাগরি সংরক্ষিত");
      setForm({ ...form, slug: "", bn: "", en: "", description: "", description_en: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ slug, active }: { slug: string; active: boolean }) => {
      const res = await setCategoryActiveAction(slug, active);
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-xs text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <div>
      <div className="grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-4">
        {(["slug", "bn", "en", "emoji", "description", "description_en", "service_route", "eta", "eta_en"] as const).map((k) => (
          <input
            key={k}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={
              {
                slug: "slug",
                bn: "বাংলা নাম",
                en: "English",
                emoji: "ইমোজি",
                description: "বাংলা বর্ণনা",
                description_en: "English description",
                service_route: "সার্ভিস লিংক (/home-services)",
                eta: "সময় (বাংলা)",
                eta_en: "ETA (English)",
              }[k]
            }
            className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
          />
        ))}
        <select
          value={form.kind}
          onChange={(e) => setForm({ ...form, kind: e.target.value })}
          className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
        >
          <option value="product">পণ্য ক্যাটাগরি</option>
          <option value="service">হোম সার্ভিস</option>
        </select>
        <input
          type="number"
          value={form.base_fee}
          onChange={(e) => setForm({ ...form, base_fee: Number(e.target.value) })}
          placeholder="শুরুর ফি"
          className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
        />
        <label className="flex items-center gap-1.5 text-[11px]">
          <input type="checkbox" checked={form.home_delivery} onChange={(e) => setForm({ ...form, home_delivery: e.target.checked })} />
          হোম ডেলিভারি
        </label>
        <label className="flex items-center gap-1.5 text-[11px]">
          <input type="checkbox" checked={form.home_service} onChange={(e) => setForm({ ...form, home_service: e.target.checked })} />
          হোম সার্ভিস
        </label>
        <button
          disabled={!form.slug || !form.bn}
          onClick={() => add.mutate()}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 sm:col-span-4"
        >
          ক্যাটাগরি যোগ / আপডেট
        </button>
      </div>

      <CategoryPreview form={form} />

      <div className="mt-3 space-y-2">
        {(data ?? []).map((c) => (
          <div key={c.slug} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
            <span className="text-lg">{c.emoji}</span>
            <p className="flex-1 text-xs font-semibold">
              {c.bn} <span className="text-muted-foreground">· {c.slug}</span>
            </p>
            <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary-dark">
              {(c as { kind?: string }).kind === "service" ? "হোম সার্ভিস" : "পণ্য"}
            </span>
            {(c as { home_delivery?: boolean }).home_delivery && (
              <span className="rounded bg-muted px-2 py-0.5 text-[10px]">হোম ডেলিভারি</span>
            )}
            <button
              onClick={() =>
                setForm({
                  slug: c.slug,
                  bn: c.bn,
                  en: c.en,
                  emoji: c.emoji,
                  description: (c as { description?: string }).description ?? "",
                  description_en: (c as { description_en?: string }).description_en ?? "",
                  kind: (c as { kind?: string }).kind ?? "product",
                  home_delivery: (c as { home_delivery?: boolean }).home_delivery ?? true,
                  home_service: (c as { home_service?: boolean }).home_service ?? false,
                  service_route: (c as { service_route?: string }).service_route ?? "",
                  eta: (c as { eta?: string }).eta ?? "",
                  eta_en: (c as { eta_en?: string }).eta_en ?? "",
                  base_fee: Number((c as { base_fee?: number }).base_fee ?? 0),
                })
              }
              className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold"
            >
              এডিট
            </button>
            <button
              onClick={() => toggle.mutate({ slug: c.slug, active: !c.active })}
              className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold"
            >
              {c.active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- offers ---------------- */
