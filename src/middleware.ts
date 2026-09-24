import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { withBasePath } from "@/lib/basePath";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth");

  const origin = req.nextUrl.origin;

  if (isPublic) {
    if (req.auth && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL(withBasePath("/dashboard"), origin));
    }
    return NextResponse.next();
  }

  if (!req.auth) {
    const login = new URL(withBasePath("/login"), origin);
    login.searchParams.set("callbackUrl", withBasePath(pathname));
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
