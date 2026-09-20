"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listAppSettingsAction, updateAppSettingAction } from "@/actions/admin-catalog";
import { catalogQueryKey } from "@/lib/catalog-db";

export function Settings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await listAppSettingsAction();
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
  });
  const [draft, setDraft] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await updateAppSettingAction(key, value);
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("সেটিংস সংরক্ষিত");
      void qc.invalidateQueries({ queryKey: ["admin-settings"] });
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-xs text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <div className="space-y-2">
      {(data ?? []).map((s) => (
        <div key={s.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
          <p className="min-w-0 flex-1 text-xs font-semibold">
            {s.label || s.key}
            <span className="block text-[10px] font-normal text-muted-foreground">{s.key}</span>
          </p>
          {s.value === "true" || s.value === "false" ? (
            <button
              onClick={() => save.mutate({ key: s.key, value: s.value === "true" ? "false" : "true" })}
              className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold ${
                s.value === "true" ? "border-primary text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {s.value === "true" ? "চালু" : "বন্ধ"}
            </button>
          ) : (
            <>
              <input
                value={draft[s.key] ?? s.value}
                onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })}
                className="w-44 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none"
              />
              <button
                onClick={() => save.mutate({ key: s.key, value: draft[s.key] ?? s.value })}
                className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground"
              >
                সেভ
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
