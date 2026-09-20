"use server";

import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { appointments, doctors } from "@/db/schema";
import { requireAuth, AuthError } from "@/lib/session-authz";

export type ActionResult<T = { id: string }> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

function money(n: number) {
  return Number(n || 0).toFixed(2);
}

export async function getDoctorTakenSlotsAction(input: {
  doctorId: string;
  from: string;
  to: string;
}): Promise<ActionResult<{ slots: string[] }>> {
  try {
    const from = new Date(input.from);
    const to = new Date(input.to);
    const rows = await db
      .select({ appointmentDate: appointments.appointmentDate, timeSlot: appointments.timeSlot })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, input.doctorId),
          ne(appointments.status, "cancelled"),
          gte(appointments.appointmentDate, from),
          lte(appointments.appointmentDate, to)
        )
      );
    const slots = rows.map((r) => {
      // Prefer full ISO if timeSlot encodes it; else combine date + slot
      if (r.timeSlot && r.timeSlot.includes("T")) return r.timeSlot;
      return r.appointmentDate.toISOString();
    });
    return { ok: true, slots };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Slot lookup failed",
      status: 500,
    };
  }
}

export async function bookAppointmentAction(input: {
  doctorId: string;
  mode: string;
  scheduledAt: string;
  patientName: string;
  phone: string;
  note?: string;
  paymentMethod?: string;
  paymentRef?: string;
}): Promise<ActionResult<{ id: string; invoice_no: string }>> {
  try {
    const session = await requireAuth();
    const scheduled = new Date(input.scheduledAt);
    if (Number.isNaN(scheduled.getTime())) {
      return { ok: false, error: "Invalid scheduled time", status: 400 };
    }
    if (scheduled.getTime() < Date.now() - 60_000) {
      return { ok: false, error: "PAST_SLOT", status: 400 };
    }

    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, input.doctorId))
      .limit(1);
    if (!doctor || !doctor.isActive) {
      return { ok: false, error: "Doctor not found", status: 404 };
    }

    const timeSlot = scheduled.toISOString();
    const conflict = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, input.doctorId),
          eq(appointments.timeSlot, timeSlot),
          ne(appointments.status, "cancelled")
        )
      )
      .limit(1);
    if (conflict.length) {
      return { ok: false, error: "SLOT_TAKEN", status: 409 };
    }

    const id = crypto.randomUUID();
    const invoiceNo = `APT-${Date.now().toString().slice(-8)}`;
    const paid =
      input.paymentMethod && input.paymentMethod !== "cod" ? "paid" : "unpaid";

    await db.insert(appointments).values({
      id,
      doctorId: input.doctorId,
      patientId: session.user!.id!,
      patientName: input.patientName.slice(0, 150),
      patientPhone: input.phone.slice(0, 50),
      appointmentDate: scheduled,
      timeSlot,
      status: "confirmed",
      consultationType: input.mode || "video",
      fee: money(Number(doctor.consultationFee)),
      paymentStatus: paid,
    });

    // Optional note via raw if column exists later
    if (input.note) {
      try {
        await db.execute(
          sql`UPDATE appointments SET notes = ${input.note.slice(0, 500)} WHERE id = ${id}`
        );
      } catch {
        /* notes column optional */
      }
    }
    void invoiceNo;
    void input.paymentRef;

    revalidatePath("/doctor-consultation");
    revalidatePath(`/consultation/${id}`);
    revalidatePath("/admin");

    return { ok: true, id, invoice_no: invoiceNo };
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

export async function cancelAppointmentAction(input: {
  appointmentId: string;
  reason?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const [appt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, input.appointmentId))
      .limit(1);
    if (!appt) return { ok: false, error: "Not found", status: 404 };

    const role = (session.user as { role?: string }).role || "customer";
    const staff = new Set([
      "pharmacist",
      "doctor",
      "staff",
      "erp_manager",
      "admin",
      "super_admin",
    ]);
    if (appt.patientId !== session.user!.id && !staff.has(role)) {
      return { ok: false, error: "Forbidden", status: 403 };
    }

    await db
      .update(appointments)
      .set({ status: "cancelled" })
      .where(eq(appointments.id, input.appointmentId));

    if (input.reason) {
      try {
        await db.execute(
          sql`UPDATE appointments SET cancel_reason = ${input.reason.slice(0, 500)} WHERE id = ${input.appointmentId}`
        );
      } catch {
        /* optional */
      }
    }

    revalidatePath(`/consultation/${input.appointmentId}`);
    revalidatePath("/admin");
    return { ok: true, id: input.appointmentId };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Cancel failed",
      status: 500,
    };
  }
}
