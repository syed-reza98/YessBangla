import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { useMediaLibrary, uploadMedia, deleteMedia, signedMediaUrl, type MediaRow } from "@/lib/siteContent";
import { insertMediaRecordAction, updateMediaUrlAction } from "@/actions/cms";
import { Upload, Trash2, Copy, Loader2, RefreshCw, Link2, FolderSync } from "lucide-react";
import { listSiteAssets, resolveMediaUrl } from "@/lib/mediaAssets";

export const Route = createFileRoute("/admin/media")({
  head: () => ({
    meta: [
      { title: "Media library — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminMedia,
});

function AdminMedia() {
  const { data, isLoading, refetch } = useMediaLibrary();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [folder, setFolder] = useState("general");
  const [filter, setFilter] = useState("");

  /** Register every image bundled with the site into the gallery (idempotent). */
  const syncSiteAssets = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const existing = new Set((data ?? []).map((r) => r.url));
      const missing = listSiteAssets().filter((a) => !existing.has(a.ref));
      for (const a of missing) {
        const result = await insertMediaRecordAction({
          name: a.name,
          path: a.ref,
          url: a.ref,
          folder: a.folder,
          mime_type: a.name.endsWith(".png")
            ? "image/png"
            : a.name.endsWith(".webp")
              ? "image/webp"
              : a.name.endsWith(".svg")
                ? "image/svg+xml"
                : "image/jpeg",
          alt_text: a.name.replace(/[-_]/g, " ").replace(/\.[a-z]+$/i, ""),
        });
        if (!result.ok) throw new Error(result.error);
      }
      setMsg(missing.length ? `${missing.length} site image(s) added to the gallery.` : "Gallery already up to date.");
      await refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  };

  /** Save an external image link straight into the gallery. */
  const addByUrl = async () => {
    const url = window.prompt("Paste an image URL (https://…)");
    if (!url?.trim()) return;
    const clean = url.trim();
    const result = await insertMediaRecordAction({
      name: clean.split("/").pop() || "external-image",
      path: clean,
      url: clean,
      folder: "links",
      mime_type: "image/*",
    });
    if (!result.ok) setErr(result.error);
    else {
      setMsg("Image link added.");
      await refetch();
    }
  };

  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      for (const file of Array.from(files)) await uploadMedia(file, folder);
      setMsg(`${files.length} file(s) uploaded.`);
      await refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDelete = async (row: MediaRow) => {
    if (!window.confirm(`Delete ${row.file_name}?`)) return;
    try {
      await deleteMedia(row);
      await refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const refreshLink = async (row: MediaRow) => {
    if (!row.path) return;
    const url = await signedMediaUrl(row.path);
    await updateMediaUrlAction({ id: row.id, url });
    await navigator.clipboard.writeText(url).catch(() => {});
    setMsg("Fresh link copied to clipboard.");
    await refetch();
  };

  const shown = (data ?? []).filter((r) =>
    filter
      ? `${r.file_name} ${r.folder ?? ""} ${r.alt_text ?? ""}`.toLowerCase().includes(filter.toLowerCase())
      : true,
  );

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(resolveMediaUrl(url) || url).catch(() => {});
    setMsg("Link copied.");
  };

  return (
    <div>
      <AdminPageHeader
        title="Media library"
        titleBn="মিডিয়া লাইব্রেরি"
        description="Every image in the portal in one place — upload new files, add links, or reuse bundled site artwork."
        actions={
          <>
            <button
              onClick={syncSiteAssets}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
            >
              <FolderSync className="h-4 w-4" /> Sync site images
            </button>
            <button
              onClick={addByUrl}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
            >
              <Link2 className="h-4 w-4" /> Add by URL
            </button>
            <input
              value={folder}
              onChange={(e) => setFolder(e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase())}
              className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              aria-label="Folder"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => onPick(e.target.files)}
            />
          </>
        }
      />

      {err && <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      {msg && <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{msg}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search images…"
          className="w-56 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        {["all", "site", "ventures", "public", "links"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f === "all" ? "" : f)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs capitalize hover:bg-secondary"
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{shown.length} image(s)</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {shown.map((row) => (
          <figure key={row.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-[4/3] bg-secondary/50">
              {row.url && (
                <img src={resolveMediaUrl(row.url)} alt={row.alt_text || row.file_name} className="h-full w-full object-cover" loading="lazy" />
              )}
            </div>
            <figcaption className="p-3">
              <div className="truncate text-xs font-medium" title={row.file_name}>
                {row.file_name}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {row.folder} · {Math.round((row.size_bytes ?? 0) / 1024)} KB
              </div>
              <div className="mt-2 flex gap-1">
                <button onClick={() => copy(row.url)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Copy link">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => refreshLink(row)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Refresh link">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onDelete(row)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      {!isLoading && shown.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No media here — upload a file, add a link, or press "Sync site images".
        </p>
      )}
    </div>
  );
}
