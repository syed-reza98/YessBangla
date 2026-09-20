import { auth } from "@/auth";
import { NextResponse } from "next/server";

const STAFF_PREFIXES = [
  "/dashboard",
  "/pos",
  "/inventory",
  "/products",
  "/purchases",
  "/purchase-orders",
  "/sales",
  "/journal",
  "/accounts",
  "/chart-of-accounts",
  "/day-book",
  "/financials",
  "/party-statement",
  "/expenses",
  "/budget",
  "/users",
  "/branches",
  "/settings",
  "/riders",
  "/delivery-orders",
  "/delivery-zones",
  "/labels",
  "/reports",
  "/audit-logs",
  "/api-hub",
  "/catalog",
  "/commerce",
  "/contacts",
  "/coupons",
  "/promotions",
  "/payments",
  "/mobile-payments",
  "/reviews",
  "/stock-adjustments",
  "/stock-count",
  "/stock-transfers",
  "/product-audit",
];

function isStaffPath(pathname: string) {
  return STAFF_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export const proxy = auth((req) => {
  const path = req.nextUrl.pathname;
  if (!isStaffPath(path)) return NextResponse.next();

  if (!req.auth) {
    const login = new URL("/signin", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  const role = (req.auth.user as { role?: string } | undefined)?.role || "customer";
  const staffRoles = new Set(["cashier", "manager", "admin", "super_admin"]);
  if (!staffRoles.has(role)) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pos/:path*",
    "/inventory/:path*",
    "/products/:path*",
    "/purchases/:path*",
    "/purchase-orders/:path*",
    "/sales/:path*",
    "/journal/:path*",
    "/accounts/:path*",
    "/chart-of-accounts/:path*",
    "/day-book/:path*",
    "/financials/:path*",
    "/party-statement/:path*",
    "/expenses/:path*",
    "/budget/:path*",
    "/users/:path*",
    "/branches/:path*",
    "/settings/:path*",
    "/riders/:path*",
    "/delivery-orders/:path*",
    "/delivery-zones/:path*",
    "/labels/:path*",
    "/reports/:path*",
    "/audit-logs/:path*",
    "/api-hub/:path*",
    "/catalog/:path*",
    "/commerce/:path*",
    "/contacts/:path*",
    "/coupons/:path*",
    "/promotions/:path*",
    "/payments/:path*",
    "/mobile-payments/:path*",
    "/reviews/:path*",
    "/stock-adjustments/:path*",
    "/stock-count/:path*",
    "/stock-transfers/:path*",
    "/product-audit/:path*",
  ],
};

export default proxy;
