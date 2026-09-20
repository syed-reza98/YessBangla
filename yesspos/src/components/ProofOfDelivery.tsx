import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Eraser,
  ImageIcon,
  Loader2,
  MapPin,
  PenLine,
  ShieldCheck,
  ShieldX,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { logAudit } from "@/lib/audit";
import { useMyRole } from "@/lib/use-my-role";
import {
  deleteDeliveryProofAction,
  listDeliveryProofsAction,
  uploadDeliveryProofAction,
  verifyDeliveryProofAction,
} from "@/actions/delivery";

type Proof = {
  id: string;
  kind: string;
  file_path: string;
  receiver_name: string | null;
  note: string | null;
  created_at: string;
  captured_at: string | null;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  status: string;
  reject_reason: string | null;
  verified_at: string | null;
};

/** Public upload path or absolute URL preview. */
function ProofImage({ path, alt }: { path: string; alt: string }) {
  const url = path.startsWith("http") || path.startsWith("/")
    ? path
    : `/uploads/${path}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className="h-24 w-24 rounded-lg border border-border object-cover"
      />
    </a>
  );
}

/** Signature pad on a canvas; returns a PNG blob. */
function SignaturePad({ onSave, saving }: { onSave: (blob: Blob) => void; saving: boolean }) {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={600}
        height={220}
        className="h-32 w-full touch-none rounded-lg border border-dashed border-border bg-background"
        onPointerDown={(e) => {
          drawing.current = true;
          dirty.current = true;
          const ctx = canvasRef.current!.getContext("2d")!;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#111827";
          const p = pos(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvasRef.current!.getContext("2d")!;
          const p = pos(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }}
        onPointerUp={() => {
          drawing.current = false;
        }}
        onPointerLeave={() => {
          drawing.current = false;
        }}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const c = canvasRef.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            dirty.current = false;
          }}
        >
          <Eraser className="mr-1 size-3.5" /> {bn ? "মুছুন" : "Clear"}
        </Button>
        <Button
          size="sm"
          disabled={saving}
          onClick={() => {
            if (!dirty.current) {
              toast.error(bn ? "আগে স্বাক্ষর করুন" : "Draw a signature first");
              return;
            }
            const c = canvasRef.current!;
            // white background for readability
            const out = document.createElement("canvas");
            out.width = c.width;
            out.height = c.height;
            const octx = out.getContext("2d")!;
            octx.fillStyle = "#ffffff";
            octx.fillRect(0, 0, out.width, out.height);
            octx.drawImage(c, 0, 0);
            out.toBlob((b) => b && onSave(b), "image/png");
          }}
        >
          {saving ? (
            <Loader2 className="mr-1 size-3.5 animate-spin" />
          ) : (
            <Upload className="mr-1 size-3.5" />
          )}
          {bn ? "স্বাক্ষর সংরক্ষণ" : "Save signature"}
        </Button>
      </div>
    </div>
  );
}

export function ProofOfDelivery({ orderId, orderNo }: { orderId: string; orderNo: number }) {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"photo" | "signature">("photo");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { data: me } = useMyRole();
  const canVerify =
    me?.role === "admin" || me?.role === "super_admin" || me?.role === "manager";

  const proofs = useQuery({
    queryKey: ["delivery-proofs", orderId],
    enabled: open,
    queryFn: async () => {
      const res = await listDeliveryProofsAction({ orderId });
      if (!res.ok) throw new Error(res.error);
      return res.proofs as unknown as Proof[];
    },
  });

  const upload = useMutation({
    mutationFn: async ({ blob, kind }: { blob: Blob; kind: "photo" | "signature" }) => {
      const file =
        blob instanceof File
          ? blob
          : new File([blob], `${kind}-${Date.now()}.png`, {
              type: blob.type || "image/png",
            });
      const fd = new FormData();
      fd.set("orderId", orderId);
      fd.set("file", file);
      fd.set("receiverName", receiver.trim());
      fd.set("note", note.trim());
      fd.set("kind", kind);
      try {
        const pos = await new Promise<GeolocationPosition | null>((resolve) => {
          if (!navigator.geolocation) {
            resolve(null);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 4000 }
          );
        });
        if (pos) {
          fd.set("lat", String(pos.coords.latitude));
          fd.set("lng", String(pos.coords.longitude));
        }
      } catch {
        /* optional GPS */
      }
      const res = await uploadDeliveryProofAction(fd);
      if (!res.ok) throw new Error(res.error);
      await logAudit("delivery_proof_upload", {
        entity: "delivery_proofs",
        entityId: orderId,
        details: `#${orderNo} ${kind}`,
      });
    },
    onSuccess: () => {
      setNote("");
      void qc.invalidateQueries({ queryKey: ["delivery-proofs", orderId] });
      void qc.invalidateQueries({ queryKey: ["delivery-orders"] });
      void qc.invalidateQueries({ queryKey: ["delivery-order-events", orderId] });
      toast.success(
        bn
          ? "প্রমাণ সংরক্ষিত — অর্ডার ডেলিভার্ড"
          : "Proof saved — order marked delivered",
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Upload failed"),
  });

  const verify = useMutation({
    mutationFn: async (input: {
      proofId: string;
      status: "approved" | "rejected";
    }) => {
      const res = await verifyDeliveryProofAction({
        proofId: input.proofId,
        status: input.status,
        reason: input.status === "rejected" ? "Rejected by staff" : null,
      });
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["delivery-proofs", orderId] });
      toast.success(bn ? "প্রুফ আপডেট হয়েছে" : "Proof updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const remove = useMutation({
    mutationFn: async (proofId: string) => {
      const res = await deleteDeliveryProofAction({ proofId });
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["delivery-proofs", orderId] });
      toast.success(bn ? "প্রুফ মুছে ফেলা হয়েছে" : "Proof deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold"
      >
        <Camera className="size-4 text-primary" />
        {bn ? "প্রুফ-অফ-ডেলিভারি" : "Proof of delivery"}
        <span className="ml-auto text-xs text-muted-foreground">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={receiver}
              maxLength={60}
              onChange={(e) => setReceiver(e.target.value)}
              placeholder={bn ? "যিনি গ্রহণ করেছেন" : "Received by"}
            />
            <Input
              value={note}
              maxLength={140}
              onChange={(e) => setNote(e.target.value)}
              placeholder={bn ? "নোট (ঐচ্ছিক)" : "Note (optional)"}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === "photo" ? "default" : "outline"}
              onClick={() => setMode("photo")}
            >
              <ImageIcon className="mr-1 size-3.5" /> {bn ? "ছবি" : "Photo"}
            </Button>
            <Button
              size="sm"
              variant={mode === "signature" ? "default" : "outline"}
              onClick={() => setMode("signature")}
            >
              <PenLine className="mr-1 size-3.5" /> {bn ? "স্বাক্ষর" : "Signature"}
            </Button>
          </div>

          {mode === "photo" ? (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  if (f.size > 5 * 1024 * 1024) {
                    toast.error(bn ? "ছবি ৫MB এর কম হতে হবে" : "Image must be under 5MB");
                    return;
                  }
                  upload.mutate({ blob: f, kind: "photo" });
                }}
              />
              <Button
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={upload.isPending}
              >
                {upload.isPending ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : (
                  <Camera className="mr-1 size-3.5" />
                )}
                {bn ? "ছবি তুলুন / আপলোড" : "Capture / upload photo"}
              </Button>
            </div>
          ) : (
            <SignaturePad
              saving={upload.isPending}
              onSave={(blob) => upload.mutate({ blob, kind: "signature" })}
            />
          )}

          <div className="flex flex-wrap gap-3">
            {(proofs.data ?? []).map((p) => (
              <div key={p.id} className="w-32 space-y-1">
                <ProofImage path={p.file_path} alt={p.kind} />
                <p className="text-[10px] text-muted-foreground">
                  {p.kind === "signature" ? (bn ? "স্বাক্ষর" : "Signature") : bn ? "ছবি" : "Photo"}{" "}
                  · {String(p.captured_at ?? p.created_at).slice(0, 16).replace("T", " ")}
                </p>
                <span
                  className={
                    p.status === "approved"
                      ? "inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
                      : p.status === "rejected"
                        ? "inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive"
                        : "inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                  }
                >
                  {p.status === "approved"
                    ? bn
                      ? "অ্যাপ্রুভড"
                      : "Approved"
                    : p.status === "rejected"
                      ? bn
                        ? "রিজেক্টেড"
                        : "Rejected"
                      : bn
                        ? "অপেক্ষমাণ"
                        : "Pending"}
                </span>
                {p.lat != null && p.lng != null ? (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[10px] text-primary underline"
                  >
                    <MapPin className="mr-0.5 inline size-3" />
                    {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    {p.accuracy_m ? ` ±${Math.round(p.accuracy_m)}m` : ""}
                  </a>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    {bn ? "লোকেশন নেই" : "No GPS"}
                  </p>
                )}
                {p.receiver_name && <p className="text-[10px]">{p.receiver_name}</p>}
                {p.reject_reason && (
                  <p className="text-[10px] text-destructive">{p.reject_reason}</p>
                )}
                {canVerify && (
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={verify.isPending || p.status === "approved"}
                      className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] text-primary disabled:opacity-40"
                      onClick={() =>
                        verify.mutate({ proofId: p.id, status: "approved" })
                      }
                    >
                      <ShieldCheck className="size-3" /> {bn ? "অ্যাপ্রুভ" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={verify.isPending}
                      className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] text-destructive disabled:opacity-40"
                      onClick={() =>
                        verify.mutate({ proofId: p.id, status: "rejected" })
                      }
                    >
                      <ShieldX className="size-3" /> {bn ? "রিজেক্ট" : "Reject"}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[10px] text-destructive"
                  onClick={() => remove.mutate(p.id)}
                >
                  <Trash2 className="size-3" /> {bn ? "মুছুন" : "Delete"}
                </button>
              </div>
            ))}
            {proofs.data && proofs.data.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {bn ? "এখনো কোনো প্রমাণ যোগ হয়নি।" : "No proof added yet."}
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
