"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { prescriptions, prescriptionShares } from "@/db/schema";
import {
  createRxShareAction,
  listRxSharesAction,
  revokeRxShareAction,
  type RxScopes,
} from "@/actions/rx";

export type { RxScopes };
export const DEFAULT_SCOPES: RxScopes = {
  medicines: true,
  dosage: true,
  prices: true,
  patient: false,
  advice: true,
};

export type RxShare = {
  id: string;
  token: string;
  expiresAt: string;
  revoked: boolean;
  views: number;
  createdAt: string;
  scopes: RxScopes;
};

type SharedItem = {
  name: string;
  strength?: string;
  generic?: string;
  form?: string;
  dose?: string;
  duration?: string;
  instruction?: string;
  price?: number | null;
};

function parseItems(notes: string | null | undefined): SharedItem[] {
  if (!notes) return [];
  try {
    const parsed = JSON.parse(notes) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const r = row as Record<string, unknown>;
          const name = String(r.name ?? r.medicine ?? "").trim();
          if (!name) return null;
          return {
            name,
            strength: r.strength != null ? String(r.strength) : undefined,
            generic: r.generic != null ? String(r.generic) : undefined,
            form: r.form != null ? String(r.form) : undefined,
            dose: r.dose != null ? String(r.dose) : undefined,
            duration: r.duration != null ? String(r.duration) : undefined,
            instruction:
              r.instruction != null ? String(r.instruction) : undefined,
            price: typeof r.price === "number" ? r.price : null,
          } satisfies SharedItem;
        })
        .filter(Boolean) as SharedItem[];
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return parseItems(JSON.stringify((parsed as { items: unknown }).items));
    }
  } catch {
    /* plain-text notes */
  }
  return [];
}

function unwrap<T extends Record<string, unknown>>(
  input: T | { data: T }
): T {
  return "data" in input ? (input.data as T) : input;
}

export async function createRxShare(
  input: { id: string; hours: number; scopes: RxScopes } | { data: { id: string; hours: number; scopes: RxScopes } }
): Promise<RxShare> {
  const data = unwrap(input);
  const res = await createRxShareAction({
    prescriptionId: data.id,
    hours: data.hours,
    scopes: data.scopes,
  });
  if (!res.ok || !res.share) throw new Error(res.ok ? "Share failed" : res.error);
  return {
    ...res.share,
    expiresAt:
      typeof res.share.expiresAt === "string"
        ? res.share.expiresAt
        : new Date(res.share.expiresAt).toISOString(),
    createdAt:
      typeof res.share.createdAt === "string"
        ? res.share.createdAt
        : new Date(res.share.createdAt).toISOString(),
  };
}

export async function listRxShares(
  input: { id: string } | { data: { id: string } }
): Promise<RxShare[]> {
  const data = unwrap(input);
  const res = await listRxSharesAction({ prescriptionId: data.id });
  if (!res.ok) throw new Error(res.error);
  return (res.shares ?? []).map((s) => {
    const row = s as RxShare;
    return {
      ...row,
      expiresAt:
        typeof row.expiresAt === "string"
          ? row.expiresAt
          : new Date(row.expiresAt).toISOString(),
      createdAt:
        typeof row.createdAt === "string"
          ? row.createdAt
          : new Date(row.createdAt).toISOString(),
      scopes: (row.scopes as RxScopes) ?? DEFAULT_SCOPES,
    };
  });
}

export async function revokeRxShare(
  input: { shareId: string } | { data: { shareId: string } }
) {
  const data = unwrap(input);
  const res = await revokeRxShareAction({ shareId: data.shareId });
  if (!res.ok) throw new Error(res.error);
  return { ok: true as const };
}

export async function readSharedRx(
  input: { token: string } | { data: { token: string } }
) {
  const data = unwrap(input);
  const [share] = await db
    .select()
    .from(prescriptionShares)
    .where(eq(prescriptionShares.token, data.token))
    .limit(1);
  if (!share) return { error: "invalid" as const };
  if (share.revoked) return { error: "revoked" as const };
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    return { error: "expired" as const };
  }

  await db
    .update(prescriptionShares)
    .set({ views: (share.views ?? 0) + 1 })
    .where(eq(prescriptionShares.id, share.id));

  const [rx] = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, share.prescriptionId))
    .limit(1);
  if (!rx) return { error: "invalid" as const };

  const scopes = {
    ...DEFAULT_SCOPES,
    ...((share.scopes as Partial<RxScopes>) ?? {}),
  };
  const allItems = parseItems(rx.notes);
  const items = scopes.medicines ? allItems : [];

  return {
    ok: true as const,
    expiresAt: new Date(share.expiresAt).toISOString(),
    scopes,
    patientName: scopes.patient ? rx.patientName ?? "" : "",
    doctorName: "",
    date: rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : "",
    advice: scopes.advice ? rx.reviewNotes ?? "" : "",
    note:
      scopes.advice && rx.notes && !rx.notes.trim().startsWith("[")
        ? rx.notes
        : "",
    imageUrl: rx.imageUrl,
    items: items.map((m) => ({
      ...m,
      price: scopes.prices ? m.price ?? null : null,
      dose: scopes.dosage ? m.dose : undefined,
      duration: scopes.dosage ? m.duration : undefined,
      instruction: scopes.dosage ? m.instruction : undefined,
    })),
  };
}

export const openRxShare = readSharedRx;
