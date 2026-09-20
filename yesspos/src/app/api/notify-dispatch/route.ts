import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const STAFF_ROLES = new Set(["cashier", "manager", "admin", "super_admin"]);

export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const role = (session.user as { role?: string }).role || "customer";
    if (!STAFF_ROLES.has(role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { dispatchPending } = await import("@/lib/notify-dispatch.server");
    const result = await dispatchPending();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[notify-dispatch] Error:", err);
    return NextResponse.json({ error: err?.message || "Dispatch failed" }, { status: 500 });
  }
}
