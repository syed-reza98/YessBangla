// Custom venture-profile export: pick any subset of the official profile
// sections and download them as a branded, editable DOCX — generated fully
// in the browser from the same dataset as the official profiles.

import { useMemo, useState } from "react";
import { CheckSquare, Download, ListChecks, Loader2, Square } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  downloadCustomProfileDocx,
  PROFILE_SECTIONS,
  type ProfileLang,
  type ProfileSectionKey,
} from "@/lib/profileCustomDocx";

interface ProfileCustomExportProps {
  slug: string;
  title: string;
}

export function ProfileCustomExport({ slug, title }: ProfileCustomExportProps) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<ProfileLang>("en");
  const [selected, setSelected] = useState<Set<ProfileSectionKey>>(
    () => new Set(PROFILE_SECTIONS.map((s) => s.key)),
  );
  const [busy, setBusy] = useState(false);

  const allSelected = selected.size === PROFILE_SECTIONS.length;
  const noneSelected = selected.size === 0;

  const countLabel = useMemo(
    () =>
      lang === "bn"
        ? `${selected.size}/${PROFILE_SECTIONS.length} সেকশন নির্বাচিত`
        : `${selected.size}/${PROFILE_SECTIONS.length} sections selected`,
    [selected, lang],
  );

  const toggle = (key: ProfileSectionKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDownload = async () => {
    if (noneSelected || busy) return;
    setBusy(true);
    try {
      await downloadCustomProfileDocx({
        slug,
        lang,
        sections: PROFILE_SECTIONS.map((s) => s.key).filter((k) => selected.has(k)),
      });
      toast.success(
        lang === "bn"
          ? "কাস্টম প্রোফাইল DOCX ডাউনলোড হয়েছে।"
          : "Custom profile DOCX downloaded.",
      );
      setOpen(false);
    } catch (err) {
      console.error("custom profile export failed:", err);
      toast.error(
        lang === "bn"
          ? "এক্সপোর্ট ব্যর্থ হয়েছে — আবার চেষ্টা করুন।"
          : "Export failed — please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/[0.06] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary transition-all hover:-translate-y-0.5 hover:border-primary/70"
        >
          <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
          Custom export · কাস্টম এক্সপোর্ট
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[88vh] w-[min(94vw,34rem)] flex-col gap-4 overflow-hidden p-5">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display text-lg sm:text-xl">
            {lang === "bn" ? "কাস্টম প্রোফাইল এক্সপোর্ট" : "Custom profile export"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {lang === "bn"
              ? `${title} — যে সেকশনগুলো দরকার শুধু সেগুলো বেছে নিয়ে সম্পাদনাযোগ্য Word (.docx) ডাউনলোড করুন।`
              : `${title} — pick only the sections you need and download them as an editable Word (.docx) on the official letterhead.`}
          </DialogDescription>
        </DialogHeader>

        {/* Language toggle */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-background/70 p-0.5" role="group" aria-label="Export language">
            {(
              [
                { id: "en", label: "English" },
                { id: "bn", label: "বাংলা" },
              ] as const
            ).map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLang(l.id)}
                aria-pressed={lang === l.id}
                lang={l.id}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.08em] transition-colors",
                  lang === l.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">{countLabel}</span>
          <div className="ml-auto flex gap-1">
            <button
              type="button"
              onClick={() => setSelected(new Set(PROFILE_SECTIONS.map((s) => s.key)))}
              disabled={allSelected}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-foreground transition-colors hover:text-primary disabled:opacity-40"
            >
              <CheckSquare className="h-3 w-3" aria-hidden="true" /> {lang === "bn" ? "সব" : "All"}
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              disabled={noneSelected}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-foreground transition-colors hover:text-primary disabled:opacity-40"
            >
              <Square className="h-3 w-3" aria-hidden="true" /> {lang === "bn" ? "মুছুন" : "Clear"}
            </button>
          </div>
        </div>

        {/* Section picker */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-background/60 p-2">
          <ul className="grid gap-1 sm:grid-cols-2">
            {PROFILE_SECTIONS.map((s) => {
              const checked = selected.has(s.key);
              const isQuote = s.key === "quote";
              return (
                <li key={s.key}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                      checked
                        ? "border-primary/50 bg-primary/[0.07] text-foreground"
                        : "border-border/60 bg-background/50 text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(s.key)}
                      aria-label={lang === "bn" ? s.bn : s.en}
                    />
                    <span className="font-medium" lang={lang}>
                      {lang === "bn" ? s.bn : s.en}
                    </span>
                    {isQuote && (
                      <span className="ml-auto text-[10px] text-muted-foreground/70">
                        {lang === "bn" ? "যদি থাকে" : "if available"}
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={noneSelected || busy}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {lang === "bn" ? "DOCX ডাউনলোড করুন" : "Download DOCX"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
