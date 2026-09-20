import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const path = req.nextUrl.pathname;
  const isAdmin = path.startsWith("/admin");
  const isAccount = path.startsWith("/account");

  if (!isAdmin && !isAccount) return NextResponse.next();

  if (!req.auth) {
    const login = new URL("/auth", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  if (isAdmin) {
    const role = (req.auth.user as { role?: string } | undefined)?.role || "customer";
    const staff = new Set([
      "pharmacist",
      "doctor",
      "staff",
      "erp_manager",
      "admin",
      "super_admin",
    ]);
    if (!staff.has(role)) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
