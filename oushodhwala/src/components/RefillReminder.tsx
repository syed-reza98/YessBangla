import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, BellOff } from "lucide-react";
import { toggleRefillReminderAction } from "@/actions/admin-entities";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";

/** রিফিল রিমাইন্ডার — নির্দিষ্ট দিন পরপর ঔষধ ফুরিয়ে যাওয়ার আগে মনে করিয়ে দেয় */
export function RefillReminder({ productId, productName }: { productId: string; productName: string }) {
  const t = useT();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [days, setDays] = useState(30);
  const [existingId, setExistingId] = useState<string | null>(null);

  const { data: existing } = useQuery({
    queryKey: ["refill", productId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Lightweight: treat local state; server toggle is source of truth after mutation
      return existingId ? { id: existingId } : null;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (existingId) {
        const res = await toggleRefillReminderAction({
          product_id: productId,
          existing_id: existingId,
        });
        if (!res.ok) throw new Error(res.error);
        setExistingId(null);
        return;
      }
      const next = new Date();
      next.setDate(next.getDate() + days);
      const res = await toggleRefillReminderAction({
        product_id: productId,
        reminder_date: next.toISOString(),
        frequency_days: days,
      });
      if (!res.ok) throw new Error(res.error);
      if (res.id) setExistingId(res.id);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["refill"] }),
  });

  if (!user) return null;

  const on = !!existingId || !!existing;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
      {on ? <BellRing className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
      <p className="text-xs font-semibold">
        {t("রিফিল রিমাইন্ডার", "Refill reminder")} · {productName}
      </p>
      {!on && (
        <input
          type="number"
          min={7}
          max={180}
          value={days}
          onChange={(e) => setDays(Number(e.target.value) || 30)}
          className="ml-auto w-16 rounded-lg border border-border bg-background px-2 py-1 text-xs"
        />
      )}
      <button
        type="button"
        disabled={toggle.isPending}
        onClick={() => toggle.mutate()}
        className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
      >
        {on ? t("বন্ধ করুন", "Turn off") : t("চালু করুন", "Turn on")}
      </button>
    </div>
  );
}
