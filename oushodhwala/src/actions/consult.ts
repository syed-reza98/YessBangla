"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import {
  appointments,
  consultationMessages,
  consultationMedia,
  consultationPrescriptions,
  doctorReviews,
} from "@/db/schema";
import { requireAuth, requireStaff, AuthError } from "@/lib/session-authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof AuthError) return { ok: false, error: err.message };
  return { ok: false, error: err instanceof Error ? err.message : "Request failed" };
}

function apptLegacy(r: typeof appointments.$inferSelect) {
  return {
    id: r.id,
    doctor_id: r.doctorId,
    patient_id: r.patientId,
    patient_name: r.patientName,
    patient_phone: r.patientPhone,
    scheduled_at: r.appointmentDate,
    appointment_date: r.appointmentDate,
    time_slot: r.timeSlot,
    status: r.status,
    consultation_type: r.consultationType,
    mode: r.consultationType,
    fee: Number(r.fee),
    payment_status: r.paymentStatus,
    invoice_no: r.invoiceNo,
    refund_status: r.refundStatus,
    refund_amount: Number(r.refundAmount ?? 0),
    created_at: r.createdAt,
  };
}

export async function listAppointmentsAdminAction() {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(appointments)
      .orderBy(desc(appointments.appointmentDate));
    return { ok: true as const, data: rows.map(apptLegacy) };
  } catch (err) {
    return fail(err);
  }
}

export async function getAppointmentAction(id: string) {
  const [row] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return row ? apptLegacy(row) : null;
}

export async function setAppointmentStatusAction(id: string, status: string) {
  try {
    await requireAuth();
    await db.update(appointments).set({ status }).where(eq(appointments.id, id));
    revalidatePath("/appointments");
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function listConsultationMediaAction(appointmentId: string) {
  const rows = await db
    .select()
    .from(consultationMedia)
    .where(eq(consultationMedia.appointmentId, appointmentId))
    .orderBy(asc(consultationMedia.createdAt));
  return rows.map((r) => ({
    id: r.id,
    appointment_id: r.appointmentId,
    file_url: r.fileUrl,
    url: r.fileUrl,
    file_type: r.fileType,
    created_at: r.createdAt,
  }));
}

export async function insertConsultationMediaAction(input: {
  appointment_id: string;
  file_url: string;
  file_type?: string;
}) {
  try {
    await requireAuth();
    const id = crypto.randomUUID();
    await db.insert(consultationMedia).values({
      id,
      appointmentId: input.appointment_id,
      fileUrl: input.file_url,
      fileType: input.file_type || "image",
    });
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

export async function uploadConsultationFileAction(formData: FormData) {
  try {
    await requireAuth();
    const file = formData.get("file");
    const appointmentId = String(formData.get("appointmentId") || "");
    if (!(file instanceof File) || !appointmentId) {
      return { ok: false as const, error: "file and appointmentId required" };
    }
    const dir = path.join(process.cwd(), "public", "uploads", "consultations");
    await mkdir(dir, { recursive: true });
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const fileName = `${Date.now()}-${safe}`;
    await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));
    const url = `/uploads/consultations/${fileName}`;
    const id = crypto.randomUUID();
    await db.insert(consultationMedia).values({
      id,
      appointmentId,
      fileUrl: url,
      fileType: file.type?.startsWith("video") ? "video" : "image",
    });
    return { ok: true as const, id, url };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteConsultationMediaAction(id: string) {
  try {
    await requireAuth();
    await db.delete(consultationMedia).where(eq(consultationMedia.id, id));
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function insertConsultationMessageAction(input: {
  appointment_id: string;
  message: string;
  sender_role?: string;
}) {
  try {
    const session = await requireAuth();
    const id = crypto.randomUUID();
    await db.insert(consultationMessages).values({
      id,
      appointmentId: input.appointment_id,
      senderId: session.user!.id!,
      senderRole: input.sender_role || "patient",
      message: input.message,
    });
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

export async function getDoctorReviewForAppointmentAction(appointmentId: string) {
  // Schema lacks appointment_id — store link via comment prefix or return null for missing column.
  // Prefer looking up by appointment through a JSON-less fallback: latest review by current user.
  void appointmentId;
  return null as null | Record<string, unknown>;
}

export async function upsertDoctorReviewAction(input: {
  appointment_id: string;
  doctor_id: string;
  rating: number;
  comment?: string;
  existing?: boolean;
}) {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    const payloadComment = JSON.stringify({
      appointment_id: input.appointment_id,
      text: input.comment || "",
    });
    if (input.existing) {
      await db
        .update(doctorReviews)
        .set({ rating: input.rating, comment: payloadComment })
        .where(and(eq(doctorReviews.doctorId, input.doctor_id), eq(doctorReviews.userId, userId)));
    } else {
      await db.insert(doctorReviews).values({
        id: crypto.randomUUID(),
        doctorId: input.doctor_id,
        userId,
        rating: input.rating,
        comment: payloadComment,
      });
    }
    await db
      .update(appointments)
      .set({ status: "completed" })
      .where(eq(appointments.id, input.appointment_id));
    revalidatePath("/appointments");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function getConsultationRxAction(appointmentId: string) {
  const [row] = await db
    .select()
    .from(consultationPrescriptions)
    .where(eq(consultationPrescriptions.appointmentId, appointmentId))
    .limit(1);
  if (!row) return null;
  // Extended fields live in prescription_id JSON blob when migrated; otherwise minimal.
  let extra: Record<string, unknown> = {};
  try {
    if (row.prescriptionId?.startsWith("{")) {
      extra = JSON.parse(row.prescriptionId);
    }
  } catch {
    extra = {};
  }
  return {
    id: row.id,
    appointment_id: row.appointmentId,
    prescription_id: row.prescriptionId.startsWith("{") ? null : row.prescriptionId,
    created_at: row.createdAt,
    ...extra,
  };
}

export async function upsertConsultationRxAction(input: {
  appointment_id: string;
  user_id: string;
  doctor_name: string;
  patient_name: string;
  diagnosis: string;
  advice: string;
  items: unknown[];
  follow_up?: string | null;
  existing?: boolean;
}) {
  try {
    await requireAuth();
    const blob = JSON.stringify({
      user_id: input.user_id,
      doctor_name: input.doctor_name,
      patient_name: input.patient_name,
      diagnosis: input.diagnosis,
      advice: input.advice,
      items: input.items,
      follow_up: input.follow_up ?? null,
    });
    const existing = await db
      .select({ id: consultationPrescriptions.id })
      .from(consultationPrescriptions)
      .where(eq(consultationPrescriptions.appointmentId, input.appointment_id))
      .limit(1);
    if (existing.length) {
      await db
        .update(consultationPrescriptions)
        .set({ prescriptionId: blob })
        .where(eq(consultationPrescriptions.appointmentId, input.appointment_id));
    } else {
      await db.insert(consultationPrescriptions).values({
        id: crypto.randomUUID(),
        appointmentId: input.appointment_id,
        prescriptionId: blob,
      });
    }
    revalidatePath(`/consultation/${input.appointment_id}`);
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}
