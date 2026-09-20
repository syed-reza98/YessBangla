// On-page preview of the official profile documents (PDF + DOCX) so visitors
// can review the exact file before downloading.
//
//  - PDF  → rendered inline in an <iframe> (browser-native viewer)
//  - DOCX → converted to HTML in the browser with mammoth.js (no server)

import { useCallback, useEffect, useState, useMemo, type ReactNode } from "react";
import DOMPurify from "dompurify";
import { Download, Eye, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type PreviewFormat = "pdf" | "docx";
type PreviewLang = "en" | "bn";

interface ProfilePreviewDialogProps {
  /** Document title shown in the dialog header. */
  title: string;
  pdfEn: string;
  pdfBn: string;
  docxEn: string;
  docxBn: string;
  /** Optional custom trigger; defaults to a "Preview" pill button. */
  trigger?: ReactNode;
  /** Label for the default trigger button (pass translated text). */
  triggerText?: string;
}

export function ProfilePreviewDialog({
  title,
  pdfEn,
  pdfBn,
  docxEn,
  docxBn,
  trigger,
  triggerText = "Preview",
}: ProfilePreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<PreviewFormat>("pdf");
  const [lang, setLang] = useState<PreviewLang>("en");
  const [docxHtml, setDocxHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const activeUrl = format === "pdf" ? (lang === "en" ? pdfEn : pdfBn) : lang === "en" ? docxEn : docxBn;

  const loadDocx = useCallback(async (url: string) => {
    setLoading(true);
    setError("");
    setDocxHtml("");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      // mammoth.browser is a UMD bundle — interop between default/namespace.
      // @ts-ignore — no type declarations ship for the browser subpath.
      const mod = await import("mammoth/mammoth.browser");
      const mammoth = (mod as { default?: unknown }).default ?? mod;
      const result = await (
        mammoth as { convertToHtml: (i: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> }
      ).convertToHtml({ arrayBuffer });
      setDocxHtml(DOMPurify.sanitize(result.value));
    } catch {
      setError(
        "Preview could not be loaded — please download the file instead. / প্রিভিউ লোড করা যায়নি — ফাইলটি ডাউনলোড করুন।",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && format === "docx") void loadDocx(activeUrl);
  }, [open, format, lang, activeUrl, loadDocx]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" /> {triggerText}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="flex h-[88vh] w-[min(96vw,64rem)] max-w-none flex-col gap-3 overflow-hidden p-4 sm:p-5">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display text-lg leading-snug sm:text-xl">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Review the official document before downloading · ডাউনলোডের আগে ডকুমেন্টটি দেখে নিন
          </DialogDescription>
        </DialogHeader>

        {/* Format + language toggles */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-background/70 p-0.5" role="group" aria-label="Format">
            {(["pdf", "docx"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                aria-pressed={format === f}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors",
                  format === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "pdf" ? "PDF" : "Word (.docx)"}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-full border border-border bg-background/70 p-0.5" role="group" aria-label="Language">
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
          <a
            href={activeUrl}
            download
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-glow"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download {format === "pdf" ? "PDF" : "DOCX"}
          </a>
        </div>

        {/* Preview body */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-background/60">
          {format === "pdf" ? (
            <iframe
              key={activeUrl}
              src={`${activeUrl}#view=FitH&toolbar=0&navpanes=0`}
              title={`${title} — PDF preview`}
              className="h-full w-full"
            />
          ) : loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Rendering Word preview…
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div
              className={cn(
                "h-full overflow-y-auto bg-white p-6 text-left text-[13px] leading-relaxed text-neutral-800 sm:p-10",
                "[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-neutral-900",
                "[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:border-b [&_h2]:border-amber-600/40 [&_h2]:pb-1 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#0F2350]",
                "[&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-[#B9892F]",
                "[&_p]:mb-2 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1",
                "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-neutral-300 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-neutral-300 [&_th]:px-2 [&_th]:py-1.5",
                "[&_img]:max-w-full",
                lang === "bn" && "font-bangla",
              )}
              // mammoth output is generated locally from our own trusted files.
              dangerouslySetInnerHTML={{ __html: docxHtml }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
