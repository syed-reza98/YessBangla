/**
 * FooterLivePreview — renders the real site <Footer /> with an in-memory
 * config override so the dashboard shows edits in realtime, with a
 * desktop / mobile viewport switch and a full "Public preview" mode that
 * escapes the admin chrome (portal to <body>).
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Monitor, Smartphone, ExternalLink, X } from "lucide-react";
import { Footer } from "@/components/Footer";
import type { FooterConfig } from "@/lib/footerConfig";

/** Approximate the phone rendering: apply the mobile column/alignment rules. */
function toMobileConfig(cfg: FooterConfig): FooterConfig {
  return {
    ...cfg,
    style: {
      ...cfg.style,
      columns: Math.min(cfg.style.columns, cfg.style.mobile_columns) as FooterConfig["style"]["columns"],
      align_center: cfg.style.mobile_align === "center",
    },
  };
}

function PublicPreviewOverlay({ cfg, onClose }: { cfg: FooterConfig; onClose: () => void }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const mobile = device === "mobile";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const btn = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
      active ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary"
    }`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Public footer preview"
      className="fixed inset-0 z-[200] flex flex-col bg-background"
    >
      <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Public preview <span className="font-normal normal-case tracking-normal">· পাবলিক প্রিভিউ</span>
        </p>
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={() => setDevice("desktop")} className={btn(!mobile)} aria-pressed={!mobile}>
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>
          <button type="button" onClick={() => setDevice("mobile")} className={btn(mobile)} aria-pressed={mobile}>
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close public preview"
            className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-secondary"
          >
            <X className="h-3.5 w-3.5" /> Close · বন্ধ
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className={mobile ? "mx-auto w-[390px] max-w-full border-x border-border" : "w-full"}>
          <Footer configOverride={mobile ? toMobileConfig(cfg) : cfg} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function FooterLivePreview({ cfg }: { cfg: FooterConfig }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [publicMode, setPublicMode] = useState(false);
  const mobile = device === "mobile";
  const preview = mobile ? toMobileConfig(cfg) : cfg;

  const btn = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
      active ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"
    }`;

  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Live preview <span className="font-normal normal-case tracking-normal">· লাইভ প্রিভিউ</span>
        </p>
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={() => setDevice("desktop")} className={btn(!mobile)} aria-pressed={!mobile}>
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>
          <button type="button" onClick={() => setDevice("mobile")} className={btn(mobile)} aria-pressed={mobile}>
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
          <button
            type="button"
            onClick={() => setPublicMode(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-secondary"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Public preview · পাবলিক
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div className={mobile ? "mx-auto w-[390px] max-w-full" : "w-full"}>
          <div
            className="pointer-events-none origin-top"
            style={{ transform: "scale(0.72)", width: "138.9%", marginBottom: "-28%" }}
          >
            <Footer configOverride={preview} />
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        এখানে সব পরিবর্তন সাথে সাথেই দেখা যাচ্ছে — সেভ করলে সাইটে প্রয়োগ হবে।
      </p>

      {publicMode && <PublicPreviewOverlay cfg={cfg} onClose={() => setPublicMode(false)} />}
    </div>
  );
}
