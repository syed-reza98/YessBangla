"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateProductStockAction, listCategorySlugsAction, upsertProductAction } from "@/actions/admin-catalog";
import { bn } from "@/data/catalog";
import { catalogQueryKey } from "@/lib/catalog-db";
import { WEEKDAYS } from "@/lib/appointments";
import { opsStart, opsSuccess, opsFailure } from "@/lib/ops";
import { AdminDashboard } from "@/components/AdminDashboard";
import { TestReportView } from "@/components/TestReportView";
import { useProducts, useOrders } from "@/components/admin/admin-data";

export function Inventory() {
  const qc = useQueryClient();
  const { data, isLoading } = useProducts();
  const [onlyLow, setOnlyLow] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const save = useMutation({
    mutationFn: async ({ id, stock, low }: { id: string; stock: number; low: number }) => {
      const res = await updateProductStockAction(id, stock, low);
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("স্টক আপডেট হয়েছে");
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-xs text-muted-foreground">লোড হচ্ছে...</p>;

  const term = q.trim().toLowerCase();
  const list = ((data ?? []) as InvProduct[]).filter((p) => {
    if (onlyLow && p.stock > p.low_stock_threshold) return false;
    if (!term) return true;
    return [p.name, p.brand, p.manufacturer, p.generic].some((v) => (v ?? "").toLowerCase().includes(term));
  });

  const groups = new Map<string, InvProduct[]>();
  for (const p of list) {
    const company = (p.manufacturer || p.brand || "").trim() || "অন্যান্য কোম্পানি";
    const arr = groups.get(company);
    if (arr) arr.push(p);
    else groups.set(company, [p]);
  }
  const companies = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], "bn"));

  return (
    <div>
      <AddProduct />

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="কোম্পানি, ঔষধ বা জেনেরিক খুঁজুন"
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none"
        />
        <label className="flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
          শুধু কম স্টকের পণ্য
        </label>
        <span className="text-[11px] text-muted-foreground">
          {bn(companies.length)} কোম্পানি · {bn(list.length)} ঔষধ
        </span>
      </div>


      {companies.length === 0 && <p className="text-xs text-muted-foreground">কিছু পাওয়া যায়নি।</p>}

      <div className="space-y-2">
        {companies.map(([company, items]) => {
          const lowCount = items.filter((p) => p.stock <= p.low_stock_threshold).length;
          const expanded = open[company] ?? Boolean(term);
          const generics = [...new Set(items.map((p) => (p.generic ?? "").trim()).filter(Boolean))];
          return (
            <section key={company} className="overflow-hidden rounded-xl border border-border bg-card">
              <button
                onClick={() => setOpen((s) => ({ ...s, [company]: !expanded }))}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
              >
                <span className="text-xs">{expanded ? "▾" : "▸"}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{company}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {bn(generics.length)} জেনেরিক · {generics.slice(0, 3).join(", ")}
                    {generics.length > 3 ? "…" : ""}
                  </span>
                </span>
                {lowCount > 0 && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-sale">
                    {bn(lowCount)} কম স্টক
                  </span>
                )}
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold">
                  {bn(items.length)} ঔষধ
                </span>
              </button>
              {expanded && (
                <div className="space-y-2 border-t border-border bg-background/40 p-2">
                  {items.map((p) => (
                    <StockRow key={p.id} p={p} onSave={(stock, low) => save.mutate({ id: p.id, stock, low })} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function AddProduct() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "",
    en: "",
    brand: "",
    manufacturer: "",
    generic: "",
    strength: "",
    form: "ট্যাবলেট",
    pack: "",
    price: "",
    mrp: "",
    category: "medicine",
    emoji: "💊",
    stock: "50",
    low: "10",
    rx: false,
    image_url: "",
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  const { data: cats } = useQuery({
    queryKey: ["admin-categories-min"],
    queryFn: async () => {
      const res = await listCategorySlugsAction();
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const name = f.name.trim();
      if (!name) throw new Error("পণ্যের নাম দিন");
      const price = Number(f.price) || 0;
      if (price <= 0) throw new Error("সঠিক দাম দিন");
      const id =
        (f.en.trim() || name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 40) || "prod";
      const res = await upsertProductAction({
        id: `${id}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        en: f.en.trim(),
        brand: f.brand.trim(),
        manufacturer: f.manufacturer.trim(),
        generic: f.generic.trim(),
        strength: f.strength.trim(),
        base_name: name.replace(/\s+\S*\d+\S*$/, "").trim(),
        form: f.form.trim(),
        pack: f.pack.trim(),
        price,
        mrp: Number(f.mrp) || price,
        category: f.category,
        emoji: f.emoji || "💊",
        rx: f.rx,
        stock: Number(f.stock) || 0,
        low_stock_threshold: Number(f.low) || 0,
        image_url: f.image_url.trim(),
        active: true,
      });
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("নতুন পণ্য যুক্ত হয়েছে");
      setF((s) => ({ ...s, name: "", en: "", generic: "", strength: "", pack: "", price: "", mrp: "", image_url: "" }));
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field = (k: keyof typeof f, label: string, extra?: { numeric?: boolean }) => (
    <label className="text-[10px] font-semibold text-muted-foreground">
      {label}
      <input
        value={String(f[k])}
        onChange={(e) => set(k, e.target.value)}
        inputMode={extra?.numeric ? "numeric" : undefined}
        className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none"
      />
    </label>
  );

  return (
    <section className="mb-3 overflow-hidden rounded-xl border border-border bg-card">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
        <span className="text-xs">{open ? "▾" : "▸"}</span>
        <span className="flex-1 text-sm font-bold">➕ নতুন পণ্য যোগ করুন</span>
        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">নতুন</span>
      </button>
      {open && (
        <div className="border-t border-border p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {field("name", "নাম (বাংলা) *")}
            {field("en", "নাম (English)")}
            {field("generic", "জেনেরিক")}
            {field("strength", "মাত্রা (যেমন 500mg)")}
            {field("brand", "ব্র্যান্ড")}
            {field("manufacturer", "কোম্পানি")}
            {field("form", "ধরন (ট্যাবলেট/সিরাপ)")}
            {field("pack", "প্যাক (যেমন ১০ ট্যাবলেট)")}
            {field("price", "বিক্রয় মূল্য ৳ *", { numeric: true })}
            {field("mrp", "MRP ৳", { numeric: true })}
            {field("stock", "স্টক", { numeric: true })}
            {field("low", "কম স্টক সীমা", { numeric: true })}
            <label className="text-[10px] font-semibold text-muted-foreground">
              ক্যাটাগরি
              <select
                value={f.category}
                onChange={(e) => set("category", e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none"
              >
                {(cats ?? []).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.bn}
                  </option>
                ))}
              </select>
            </label>
            {field("emoji", "ইমোজি")}
            {field("image_url", "ছবির লিংক")}
            <label className="flex items-end gap-2 pb-1 text-[11px] font-semibold">
              <input type="checkbox" checked={f.rx} onChange={(e) => set("rx", e.target.checked)} />
              প্রেসক্রিপশন লাগবে
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              disabled={create.isPending}
              onClick={() => create.mutate()}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {create.isPending ? "সেভ হচ্ছে..." : "পণ্য সেভ করুন"}
            </button>
            <span className="text-[10px] text-muted-foreground">সেভ করার পর ইনভেন্টরি ও স্টোরে সাথে সাথে দেখা যাবে।</span>
          </div>
        </div>
      )}
    </section>
  );
}


function StockRow({ p, onSave }: { p: InvProduct; onSave: (stock: number, low: number) => void }) {
  const [stock, setStock] = useState(String(p.stock));
  const [low, setLow] = useState(String(p.low_stock_threshold));
  const critical = p.stock <= p.low_stock_threshold;
  const meta = [p.generic, p.strength, p.form].map((v) => (v ?? "").trim()).filter(Boolean).join(" · ");

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 ${critical ? "border-sale" : "border-border"}`}>
      <span className="text-lg">{p.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{p.name}</p>
        {meta && <p className="truncate text-[10px] text-muted-foreground">{meta}</p>}
      </div>
      {p.stock <= 0 && <span className="rounded-full bg-sale px-2 py-0.5 text-[10px] font-bold text-sale-foreground">স্টক শেষ</span>}
      {p.stock > 0 && critical && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-sale">কম স্টক</span>}
      <label className="text-[10px] text-muted-foreground">
        স্টক
        <input
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          inputMode="numeric"
          className="ml-1 w-16 rounded border border-border bg-background px-1.5 py-1 text-xs text-foreground outline-none"
        />
      </label>
      <label className="text-[10px] text-muted-foreground">
        সীমা
        <input
          value={low}
          onChange={(e) => setLow(e.target.value)}
          inputMode="numeric"
          className="ml-1 w-14 rounded border border-border bg-background px-1.5 py-1 text-xs text-foreground outline-none"
        />
      </label>
      <button
        onClick={() => onSave(Number(stock) || 0, Number(low) || 0)}
        className="rounded-lg bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground"
      >
        সেভ
      </button>
    </div>
  );
}
