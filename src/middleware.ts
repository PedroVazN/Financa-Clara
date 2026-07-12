import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/recuperar-senha");
  const isPublic = isAuthPage || pathname === "/";

  if (!isLoggedIn && !isPublic) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isAuthPage) {
    const dest = role === "MANAGER" ? "/gestor" : "/cliente";
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  if (isLoggedIn && pathname.startsWith("/cliente") && role !== "CLIENT") {
    return NextResponse.redirect(new URL("/gestor", req.nextUrl.origin));
  }

  if (isLoggedIn && pathname.startsWith("/gestor") && role !== "MANAGER") {
    return NextResponse.redirect(new URL("/cliente", req.nextUrl.origin));
  }

  if (isLoggedIn && pathname === "/") {
    const dest = role === "MANAGER" ? "/gestor" : "/cliente";
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
