import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const path = req.nextUrl.pathname;
  const isLogin = path.startsWith("/admin/login");
  const isAdmin = path.startsWith("/admin");

  if (isAdmin && !isLogin && !req.auth) {
    const login = new URL("/admin/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
