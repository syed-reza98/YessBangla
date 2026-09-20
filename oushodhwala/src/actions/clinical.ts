"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { diagnosticBookings, prescriptions } from "@/db/schema";
import { requireAuth, AuthError } from "@/lib/session-authz";

export type ActionResult<T = { id: string }> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

function money(n: number) {
  return Number(n || 0).toFixed(2);
}

export async function bookHomeDiagnosticAction(input: {
  tests: { id: string; price: number; bn?: string; en?: string }[];
  patientName: string;
  phone: string;
  address: string;
  area?: string;
  scheduledDate: string;
  slot?: string;
  collectionFee?: number;
  discount?: number;
  paymentMethod?: string;
  note?: string;
}): Promise<ActionResult<{ id: string; booking_ids: string[] }>> {
  try {
    await requireAuth();
    if (!input.tests?.length) {
      return { ok: false, error: "Select at least one test", status: 400 };
    }
    const bookingDate = new Date(input.scheduledDate);
    if (Number.isNaN(bookingDate.getTime())) {
      return { ok: false, error: "Invalid date", status: 400 };
    }

    const address = [
      input.address,
      input.area,
      input.slot ? `Slot: ${input.slot}` : "",
      input.note || "",
    ]
      .filter(Boolean)
      .join(" · ");

    const ids: string[] = [];
    const discount = Number(input.discount || 0);
    const fee = Number(input.collectionFee || 0);
    const testTotal = input.tests.reduce((s, t) => s + Number(t.price), 0);
    const perShare =
      input.tests.length > 0
        ? (fee - discount) / input.tests.length
        : 0;

    await db.transaction(async (tx) => {
      for (const test of input.tests) {
        const id = crypto.randomUUID();
        ids.push(id);
        await tx.insert(diagnosticBookings).values({
          id,
          testId: test.id,
          patientName: input.patientName.slice(0, 150),
          patientPhone: input.phone.slice(0, 50),
          sampleCollectionAddress: address,
          bookingDate,
          status: "pending",
          totalAmount: money(Number(test.price) + perShare),
        });
      }
    });

    revalidatePath("/home-diagnostics");
    revalidatePath("/admin");
    return { ok: true, id: ids[0]!, booking_ids: ids };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Booking failed",
      status: 500,
    };
  }
}

export async function uploadPrescriptionAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    let userId: string | null = null;
    try {
      const session = await requireAuth();
      userId = session.user!.id!;
    } catch {
      /* guest upload allowed when phone present */
    }

    const note = String(formData.get("note") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const patientName = String(formData.get("patientName") || "").trim();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Prescription image required", status: 400 };
    }
    if (!userId && !phone) {
      return { ok: false, error: "Phone required for guest upload", status: 400 };
    }
    if (file.size > 8 * 1024 * 1024) {
      return { ok: false, error: "File must be under 8MB", status: 400 };
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "rx");
    await mkdir(uploadsDir, { recursive: true });
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const fileName = `${Date.now()}-${safe}`;
    await writeFile(
      path.join(uploadsDir, fileName),
      Buffer.from(await file.arrayBuffer())
    );
    const imageUrl = `/uploads/rx/${fileName}`;
    const id = crypto.randomUUID();

    await db.insert(prescriptions).values({
      id,
      userId,
      patientName: patientName || null,
      phone: phone || null,
      imageUrl,
      status: "pending",
      notes: note || null,
    });

    revalidatePath("/prescription");
    revalidatePath("/admin/rx");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed",
      status: 500,
    };
  }
}
