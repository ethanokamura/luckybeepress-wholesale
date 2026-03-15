import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/catalog",
  "/cart",
  "/orders",
  "/account",
  "/wishlist",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Admin routes — require auth (admin check happens in layout)
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Protected customer routes — require auth
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/catalog/:path*",
    "/cart/:path*",
    "/orders/:path*",
    "/account/:path*",
    "/wishlist/:path*",
  ],
};
