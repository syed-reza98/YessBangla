// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, ShoppingCart, PackageX, RotateCcw, Star, FileText } from "lucide-react";
import { bn } from "@/data/catalog";
import { getAdminNotificationFeedAction } from "@/actions/domain-queries";

type Item = {
  id: string;
  tab: string;
  icon: "orders" | "inventory" | "returns" | "reviews" | "rx";
  title: string;
  sub: string;
  at?: string;
};

const ICONS = {
  orders: ShoppingCart,
  inventory: PackageX,
  returns: RotateCcw,
  reviews: Star,
  rx: FileText,
} as const;

async function load(): Promise<Item[]> {
  const feed = await getAdminNotificationFeedAction();
  if (!feed.ok) return [];
  const items: Item[] = [];
  for (const o of feed.orders ?? [])
    items.push({
      id: `o-${o.id}`,
      tab: "orders",
      icon: "orders",
      title: `নতুন অর্ডার #${o.order_no}`,
      sub: `${o.customer_name} · ৳${bn(Math.round(Number(o.total || 0)))}`,
      at: o.created_at ? String(o.created_at) : undefined,
    });
  for (const p of feed.lowStock ?? [])
    items.push({
      id: `p-${p.id}`,
      tab: "inventory",
      icon: "inventory",
      title: `স্টক কম: ${p.name}`,
      sub: `বাকি ${bn(Number(p.stock || 0))} টি`,
    });
  for (const r of feed.returns ?? [])
    items.push({
      id: `r-${(r as any).id}`,
      tab: "returns",
      icon: "returns",
      title: `রিটার্ন অনুরোধ #${(r as any).order_no}`,
      sub: ((r as any).reason as string) || "কারণ উল্লেখ নেই",
      at: (r as any).created_at ? String((r as any).created_at) : undefined,
    });
  for (const rv of feed.reviews ?? [])
    items.push({
      id: `rv-${(rv as any).id}`,
      tab: "reviews",
      icon: "reviews",
      title: "নতুন রিভিউ মডারেশন বাকি",
      sub: `রেটিং ${bn(Number((rv as any).rating || 0))} · ${(rv as any).product_name ?? (rv as any).product_id}`,
      at: (rv as any).created_at ? String((rv as any).created_at) : undefined,
    });
  for (const x of feed.prescriptions ?? [])
    items.push({
      id: `rx-${x.id}`,
      tab: "rx",
      icon: "rx",
      title: "নতুন প্রেসক্রিপশন",
      sub: x.phone || x.id,
      at: x.created_at ? String(x.created_at) : undefined,
    });
  return items;
}

const SEEN_KEY = "admin-notif-seen";

export function AdminNotifications({ onSelect }: { onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const q = useQuery({ queryKey: ["admin-notifications"], queryFn: load, refetchInterval: 60000 });
  const items = q.data ?? [];
  const unseen = items.filter((it) => !seen.includes(it.id));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      if (raw) setSeen(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open || items.length === 0) return;
    const ids = items.map((it) => it.id);
    setSeen(ids);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-secondary"
        aria-label="নোটিফিকেশন"
      >
        <Bell className="h-4 w-4" />
        {unseen.length > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-sale px-1 text-[9px] font-bold text-primary-foreground">
            {bn(unseen.length)}
          </span>
        )}
      </button>


      {open && (
        <div className="absolute right-0 top-11 z-50 max-h-[70vh] w-[19rem] overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-bold">নোটিফিকেশন</span>
            <button onClick={() => void q.refetch()} className="text-[11px] text-muted-foreground hover:text-foreground">
              রিফ্রেশ
            </button>
          </div>
          {q.isLoading && <p className="p-4 text-center text-[11px] text-muted-foreground">লোড হচ্ছে...</p>}
          {!q.isLoading && items.length === 0 && (
            <p className="p-6 text-center text-[11px] text-muted-foreground">নতুন কিছু নেই 🎉</p>
          )}
          <ul>
            {items.map((it) => {
              const Icon = ICONS[it.icon];
              return (
                <li key={it.id}>
                  <button
                    onClick={() => {
                      onSelect(it.tab);
                      setOpen(false);
                    }}
                    className="flex w-full items-start gap-2 border-b border-border px-3 py-2.5 text-left hover:bg-secondary/60"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-semibold">{it.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{it.sub}</span>
                      {it.at && (
                        <span className="block text-[10px] text-muted-foreground">
                          {new Date(it.at).toLocaleString("bn-BD")}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
