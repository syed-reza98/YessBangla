// Reusable image field with a media-gallery picker + inline upload.
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload, X, Check } from "lucide-react";
import { useMediaLibrary, uploadMedia, type MediaRow } from "@/lib/siteContent";
import { resolveMediaUrl } from "@/lib/mediaAssets";

export function MediaPicker({
  value,
  onChange,
  label = "Image",
  labelBn = "ছবি",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  labelBn?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label} <span className="font-normal normal-case tracking-normal">· {labelBn}</span>
      </span>
      <div className="flex items-start gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/50">
          {value ? (
            <img src={resolveMediaUrl(value)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… or pick from gallery"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
            >
              <ImagePlus className="h-3.5 w-3.5" /> Gallery · গ্যালারি
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {open && (
        <MediaGalleryModal
          current={value}
          onClose={() => setOpen(false)}
          onSelect={(url) => {
            onChange(url);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function MediaGalleryModal({
  current,
  onSelect,
  onClose,
}: {
  current?: string;
  onSelect: (url: string, row: MediaRow) => void;
  onClose: () => void;
}) {
  const { data, isLoading, refetch } = useMediaLibrary();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);
    try {
      for (const f of Array.from(files)) await uploadMedia(f, "pages");
      await refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const rows = (data ?? []).filter((r) =>
    q ? `${r.file_name} ${r.folder ?? ""} ${r.alt_text ?? ""}`.toLowerCase().includes(q.toLowerCase()) : true,
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold">Image gallery</h2>
            <p className="text-xs text-muted-foreground">ইমেজ গ্যালারি — আপলোড করুন বা বেছে নিন</p>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="hidden w-40 rounded-lg border border-border bg-background px-3 py-1.5 text-sm sm:block"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onPick(e.target.files)} />
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {err && <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && rows.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No images yet — upload one to get started.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {rows.map((row) => {
              const active = current === row.url;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onSelect(row.url, row)}
                  className={`group overflow-hidden rounded-xl border text-left transition ${
                    active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-secondary/50">
                    {row.url && <img src={resolveMediaUrl(row.url)} alt={row.alt_text || row.file_name} className="h-full w-full object-cover" loading="lazy" />}
                    {active && (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="truncate px-2.5 py-2 text-[11px]" title={row.file_name}>
                    {row.file_name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
