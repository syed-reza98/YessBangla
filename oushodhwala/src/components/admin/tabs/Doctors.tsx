// @ts-nocheck
"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listDoctorsAction,
  upsertDoctorAction,
  setDoctorActiveAction,
  listDoctorBlackoutsAction,
  addDoctorBlackoutAction,
  deleteDoctorBlackoutAction,
} from "@/actions/admin-catalog";
import { bn } from "@/data/catalog";
import { catalogQueryKey } from "@/lib/catalog-db";
import { WEEKDAYS } from "@/lib/appointments";
import { opsStart, opsSuccess, opsFailure } from "@/lib/ops";
import { AdminDashboard } from "@/components/AdminDashboard";
import { TestReportView } from "@/components/TestReportView";
import { emptyDoctor } from "@/components/admin/admin-constants";

export function Doctors() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => {
      const res = await listDoctorsAction();
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
  });
  const [form, setForm] = useState<typeof emptyDoctor & { id?: string }>({ ...emptyDoctor });
  const [blackoutFor, setBlackoutFor] = useState("");

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-doctors"] });
    void qc.invalidateQueries({ queryKey: catalogQueryKey });
  };

  const save = useMutation({
    mutationFn: async () => {
      const res = await upsertDoctorAction(form as unknown as Record<string, unknown>);
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("ডাক্তার সংরক্ষিত");
      setForm({ ...emptyDoctor });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await setDoctorActiveAction(id, active);
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-xs text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <div>
      <div className="grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-3">
        {(["name", "spec", "degree", "exp", "emoji", "photo_url", "phone", "whatsapp", "video_url"] as const).map((k) => (
          <input
            key={k}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={{ name: "নাম", spec: "বিশেষত্ব", degree: "ডিগ্রি", exp: "অভিজ্ঞতা", emoji: "ইমোজি", photo_url: "ছবির লিংক", phone: "ফোন নম্বর (01…)", whatsapp: "হোয়াটসঅ্যাপ নম্বর", video_url: "ভিডিও কল লিংক" }[k]}
            className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
          />
        ))}
        {(["fee", "sort_order"] as const).map((k) => (
          <input
            key={k}
            value={String(form[k])}
            inputMode="numeric"
            onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) || 0 })}
            placeholder={{ fee: "ফি", sort_order: "ক্রম" }[k]}
            className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
          />
        ))}
        <label className="text-[10px] font-semibold text-muted-foreground">
          কর্ম শুরু
          <input type="time" value={form.work_start} onChange={(e) => setForm({ ...form, work_start: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none" />
        </label>
        <label className="text-[10px] font-semibold text-muted-foreground">
          কর্ম শেষ
          <input type="time" value={form.work_end} onChange={(e) => setForm({ ...form, work_end: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none" />
        </label>
        <label className="text-[10px] font-semibold text-muted-foreground">
          স্লট (মিনিট)
          <input value={String(form.slot_minutes)} inputMode="numeric"
            onChange={(e) => setForm({ ...form, slot_minutes: Number(e.target.value) || 30 })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none" />
        </label>
        <div className="sm:col-span-3">
          <p className="text-[10px] font-semibold text-muted-foreground">কর্মদিবস</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {WEEKDAYS.map((w, i) => {
              const on = form.work_days.includes(i);
              return (
                <button key={w} type="button"
                  onClick={() => setForm({ ...form, work_days: on ? form.work_days.filter((x) => x !== i) : [...form.work_days, i].sort() })}
                  className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {w}
                </button>
              );
            })}
          </div>
        </div>
        <button
          disabled={!form.name || save.isPending}
          onClick={() => save.mutate()}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 sm:col-span-3"
        >
          {form.id ? "ডাক্তার আপডেট" : "ডাক্তার যোগ"}
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {(data ?? []).map((d) => (
          <div key={d.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
            <span className="text-lg">{d.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{d.name}</p>
              <p className="text-[10px] text-muted-foreground">{d.spec} · ৳{bn(Number(d.fee))} {!d.active && "· নিষ্ক্রিয়"}</p>
            </div>
            <button
              onClick={() =>
                setForm({
                  id: d.id, name: d.name, spec: d.spec, degree: d.degree, exp: d.exp,
                  fee: Number(d.fee), emoji: d.emoji, photo_url: d.photo_url,
                  phone: d.phone ?? "", whatsapp: d.whatsapp ?? "", video_url: d.video_url ?? "",
                  sort_order: d.sort_order,
                  work_start: (d.work_start ?? "10:00").slice(0, 5),
                  work_end: (d.work_end ?? "22:00").slice(0, 5),
                  slot_minutes: d.slot_minutes ?? 30,
                  work_days: (d.work_days as number[] | null) ?? [0, 1, 2, 3, 4, 5, 6],
                })
              }
              className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold"
            >
              সম্পাদনা
            </button>
            <button
              onClick={() => setBlackoutFor(blackoutFor === d.id ? "" : d.id)}
              className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold"
            >
              ছুটি
            </button>
            <button
              onClick={() => toggle.mutate({ id: d.id, active: !d.active })}
              className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold"
            >
              {d.active ? "বন্ধ" : "চালু"}
            </button>
            </div>
            {blackoutFor === d.id && <Blackouts doctorId={d.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Blackouts({ doctorId }: { doctorId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-blackouts", doctorId],
    queryFn: async () => {
      const res = await listDoctorBlackoutsAction(doctorId);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
  });
  const [day, setDay] = useState("");
  const [reason, setReason] = useState("");
  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin-blackouts", doctorId] });

  const add = useMutation({
    mutationFn: async () => {
      const res = await addDoctorBlackoutAction(doctorId, day, reason.trim());
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => { toast.success("ছুটি যোগ হয়েছে"); setDay(""); setReason(""); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteDoctorBlackoutAction(id);
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-3 rounded-lg border border-dashed border-border p-3">
      <p className="text-[10px] font-bold text-muted-foreground">ছুটির দিন (ব্ল্যাকআউট)</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] outline-none" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={120} placeholder="কারণ"
          className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] outline-none" />
        <button disabled={!day || add.isPending} onClick={() => add.mutate()}
          className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-50">যোগ</button>
      </div>
      <ul className="mt-2 space-y-1">
        {data.map((b) => (
          <li key={b.id} className="flex items-center gap-2 text-[11px]">
            <span className="font-semibold">{b.day}</span>
            <span className="text-muted-foreground">{b.reason}</span>
            <button onClick={() => del.mutate(b.id)} className="ml-auto text-destructive">মুছুন</button>
          </li>
        ))}
        {data.length === 0 && <li className="text-[10px] text-muted-foreground">কোনো ছুটি নেই।</li>}
      </ul>
    </div>
  );
}

/* ---------------- prescriptions ---------------- */


/* ---------------- settings ---------------- */
