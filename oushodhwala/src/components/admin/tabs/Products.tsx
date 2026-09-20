// @ts-nocheck
"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { upsertProductAction, setProductActiveAction } from "@/actions/admin-catalog";
import { bn } from "@/data/catalog";
import { catalogQueryKey } from "@/lib/catalog-db";
import { WEEKDAYS } from "@/lib/appointments";
import { opsStart, opsSuccess, opsFailure } from "@/lib/ops";
import { AdminDashboard } from "@/components/AdminDashboard";
import { TestReportView } from "@/components/TestReportView";
import { useProducts, useOrders } from "@/components/admin/admin-data";
import { emptyProduct } from "@/components/admin/admin-constants";

export function Products() {
  const qc = useQueryClient();
  const { data, isLoading } = useProducts();
  const [edit, setEdit] = useState<typeof emptyProduct | null>(null);
  const [q, setQ] = useState("");
  const [picker, setPicker] = useState<"image_url" | "medicine_image_url" | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-products"] });
    void qc.invalidateQueries({ queryKey: catalogQueryKey });
  };

  const upsert = useMutation({
    mutationFn: async (p: typeof emptyProduct) => {
      const res = await upsertProductAction(p as unknown as Record<string, unknown>);
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("প্রোডাক্ট সংরক্ষিত হয়েছে");
      setEdit(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await setProductActiveAction(id, false);
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("প্রোডাক্ট নিষ্ক্রিয় করা হয়েছে");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-xs text-muted-foreground">লোড হচ্ছে...</p>;
  const list = (data ?? []).filter((p) => (p.name + p.en + p.brand).toLowerCase().includes(q.toLowerCase()));

  if (edit) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-bold">{edit.id ? "প্রোডাক্ট সম্পাদনা" : "নতুন প্রোডাক্ট"}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["id", "আইডি (ইউনিক)"],
              ["name", "বাংলা নাম"],
              ["en", "ইংরেজি নাম"],
              ["brand", "ব্র্যান্ড"],
              ["generic", "জেনেরিক"],
              ["form", "ফর্ম"],
              ["pack", "প্যাক"],
              ["emoji", "ইমোজি"],
              ["category", "ক্যাটাগরি স্লাগ"],
              ["image_url", "বক্সের ছবির লিংক (URL)"],
              ["medicine_image_url", "ঔষধের ছবির লিংক (URL)"],
              ["manufacturer", "প্রস্তুতকারক"],
              ["strength", "মাত্রা (যেমন ৫০০ mg)"],
              ["base_name", "মূল নাম (একই ঔষধের বিভিন্ন মাত্রা গ্রুপ)"],
              ["therapeutic_class", "থেরাপিউটিক ক্লাস (বাংলা)"],
              ["therapeutic_class_en", "Therapeutic class (English)"],
            ] as const
          ).map(([k, label]) => (
            <input
              key={k}
              value={String(edit[k])}
              disabled={k === "id" && !!data?.some((p) => p.id === edit.id) && edit.id !== ""}
              onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
              placeholder={label}
              className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
            />
          ))}
          {(
            [
              ["price", "দাম"],
              ["mrp", "MRP"],
              ["stock", "স্টক"],
              ["low_stock_threshold", "কম স্টক সীমা"],
            ] as const
          ).map(([k, label]) => (
            <input
              key={k}
              value={String(edit[k])}
              inputMode="numeric"
              onChange={(e) => setEdit({ ...edit, [k]: Number(e.target.value) || 0 })}
              placeholder={label}
              className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="text-center">
            {edit.image_url ? (
              <img src={edit.image_url} alt="বক্সের ছবি" className="h-20 w-20 rounded-lg border border-border object-contain" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-[10px] text-muted-foreground">বক্স</div>
            )}
            <button type="button" onClick={() => setPicker("image_url")} className="mt-1 rounded border border-border px-2 py-0.5 text-[10px] font-semibold">
              গ্যালারি থেকে
            </button>
          </div>
          <div className="text-center">
            {edit.medicine_image_url ? (
              <img src={edit.medicine_image_url} alt="ঔষধের ছবি" className="h-20 w-20 rounded-lg border border-border object-contain" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-[10px] text-muted-foreground">ঔষধ</div>
            )}
            <button type="button" onClick={() => setPicker("medicine_image_url")} className="mt-1 rounded border border-border px-2 py-0.5 text-[10px] font-semibold">
              গ্যালারি থেকে
            </button>
          </div>
        </div>
        {picker && (
          <MediaPickerModal
            kind={picker === "image_url" ? "box" : "medicine"}
            onClose={() => setPicker(null)}
            onPick={(a) => setEdit({ ...edit, [picker]: a.url })}
          />
        )}
        {(
          [
            ["description", "বিবরণ (বাংলা)"],
            ["description_en", "Description (English)"],
            ["indications", "নির্দেশনা (বাংলা)"],
            ["indications_en", "Indications (English)"],
            ["dosage", "মাত্রা ও সেবনবিধি (বাংলা)"],
            ["dosage_en", "Dosage (English)"],
            ["side_effects", "পার্শ্বপ্রতিক্রিয়া (বাংলা)"],
              ["side_effects_en", "Side effects (English)"],
              ["contraindications", "প্রতিনির্দেশনা (বাংলা)"],
              ["contraindications_en", "Contraindications (English)"],
              ["pregnancy", "গর্ভাবস্থায় ও স্তন্যদানকালে (বাংলা)"],
              ["pregnancy_en", "Pregnancy & Lactation (English)"],
              ["precautions", "সতর্কতা (বাংলা)"],
              ["precautions_en", "Precautions & Warnings (English)"],
              ["storage", "সংরক্ষণ (বাংলা)"],
              ["storage_en", "Storage conditions (English)"],
          ] as const
        ).map(([k, label]) => (
          <textarea
            key={k}
            value={String(edit[k])}
            onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
            rows={2}
            placeholder={label}
            className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-xs outline-none"
          />
        ))}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={edit.rx} onChange={(e) => setEdit({ ...edit, rx: e.target.checked })} /> প্রেসক্রিপশন লাগবে
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> সক্রিয়
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            disabled={!edit.id || !edit.name || upsert.isPending}
            onClick={() => upsert.mutate(edit)}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            সংরক্ষণ
          </button>
          <button onClick={() => setEdit(null)} className="rounded-lg border border-border px-4 py-2 text-xs font-semibold">
            বাতিল
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="প্রোডাক্ট খুঁজুন"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none"
        />
        <button
          onClick={() => setEdit({ ...emptyProduct })}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          + নতুন
        </button>
      </div>
      <div className="space-y-2">
        {list.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
            {p.image_url ? (
              <img src={p.image_url} alt="" className="h-9 w-9 rounded object-contain" />
            ) : (
              <span className="text-lg">{p.emoji}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{p.name} {!p.active && <span className="text-muted-foreground">(নিষ্ক্রিয়)</span>}</p>
              <p className="text-[10px] text-muted-foreground">
                ৳{bn(Number(p.price))} · স্টক {bn(p.stock)} · {p.category}
              </p>
            </div>
            <button
              onClick={() =>
                setEdit({
                  id: p.id,
                  name: p.name,
                  en: p.en,
                  brand: p.brand,
                  generic: p.generic,
                  form: p.form,
                  pack: p.pack,
                  price: Number(p.price),
                  mrp: Number(p.mrp),
                  category: p.category,
                  rx: p.rx,
                  emoji: p.emoji,
                  description: p.description,
                  description_en: p.description_en,
                  image_url: p.image_url,
                  medicine_image_url: (p as { medicine_image_url?: string }).medicine_image_url ?? "",
                  manufacturer: p.manufacturer,
                  indications: p.indications,
                  indications_en: p.indications_en,
                  dosage: p.dosage,
                  dosage_en: p.dosage_en,
                  side_effects: p.side_effects,
                  side_effects_en: p.side_effects_en,
                  strength: (p as { strength?: string }).strength ?? "",
                  base_name: (p as { base_name?: string }).base_name ?? "",
                  contraindications: (p as { contraindications?: string }).contraindications ?? "",
                  contraindications_en: (p as { contraindications_en?: string }).contraindications_en ?? "",
                  pregnancy: (p as { pregnancy?: string }).pregnancy ?? "",
                  pregnancy_en: (p as { pregnancy_en?: string }).pregnancy_en ?? "",
                  precautions: (p as { precautions?: string }).precautions ?? "",
                  precautions_en: (p as { precautions_en?: string }).precautions_en ?? "",
                  therapeutic_class: (p as { therapeutic_class?: string }).therapeutic_class ?? "",
                  therapeutic_class_en: (p as { therapeutic_class_en?: string }).therapeutic_class_en ?? "",
                  storage: (p as { storage?: string }).storage ?? "",
                  storage_en: (p as { storage_en?: string }).storage_en ?? "",
                  stock: p.stock,
                  low_stock_threshold: p.low_stock_threshold,
                  active: p.active,
                })
              }
              className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold"
            >
              সম্পাদনা
            </button>
            {p.active && (
              <button onClick={() => del.mutate(p.id)} className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold text-sale">
                নিষ্ক্রিয়
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- categories ---------------- */

type CatForm = {
  slug: string;
  bn: string;
  en: string;
  emoji: string;
  description: string;
  description_en: string;
  kind: string;
  home_delivery: boolean;
  home_service: boolean;
  service_route: string;
  eta: string;
  eta_en: string;
  base_fee: number;
};

function CategoryPreview({ form }: { form: CatForm }) {
  const isService = form.kind === "service";
  const card = (lng: "bn" | "en") => {
    const name = lng === "bn" ? form.bn || "ক্যাটাগরির নাম" : form.en || form.bn || "Category name";
    const desc = lng === "bn" ? form.description : form.description_en;
    const eta = lng === "bn" ? form.eta : form.eta_en;
    return (
      <div className="flex gap-3 rounded-xl border border-border bg-card p-3">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg text-xl ${
            isService ? "bg-primary/10" : "bg-secondary"
          }`}
        >
          {form.emoji || "🧴"}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold">{name}</span>
          <span className="mt-0.5 block line-clamp-2 text-[10px] text-muted-foreground">
            {desc || (lng === "bn" ? "বর্ণনা যোগ করুন" : "Add a description")}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1">
            {form.home_delivery && (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-primary-dark">
                {lng === "bn" ? "হোম ডেলিভারি" : "Home delivery"}
              </span>
            )}
            {form.home_service && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                {lng === "bn" ? "হোম সার্ভিস" : "Home service"}
              </span>
            )}
            {eta && <span className="text-[9px] text-muted-foreground">{eta}</span>}
            {form.base_fee > 0 && (
              <span className="text-[9px] font-semibold text-primary-dark">
                {lng === "bn" ? `শুরু ৳${form.base_fee}` : `from ৳${form.base_fee}`}
              </span>
            )}
          </span>
        </span>
      </div>
    );
  };

  return (
    <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/40 p-3">
      <p className="text-[11px] font-bold text-muted-foreground">
        লাইভ প্রিভিউ — {isService ? "হোম সার্ভিস কার্ড" : "পণ্য ক্যাটাগরি কার্ড"}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[10px] font-bold text-muted-foreground">বাংলা</p>
          {card("bn")}
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold text-muted-foreground">English</p>
          {card("en")}
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        লিংক: {isService ? form.service_route || "/home-services" : `/category/${form.slug || "slug"}`}
      </p>
    </div>
  );
}
