import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { stripBasePath, withBasePath } from "@/lib/basePath";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

function isPublicPath(pathname: string): boolean {
  const path = stripBasePath(pathname);
  return (
    path === "/login" ||
    path === "/register" ||
    path.startsWith("/api/auth")
  );
}

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const path = stripBasePath(pathname);
  const origin = req.nextUrl.origin;

  if (isPublicPath(pathname)) {
    if (req.auth && (path === "/login" || path === "/register")) {
      return NextResponse.redirect(new URL(withBasePath("/dashboard"), origin));
    }
    return NextResponse.next();
  }

  if (!req.auth) {
    const login = new URL(withBasePath("/login"), origin);
    // Relative callback without basePath prefix (Next will resolve); never self-loop
    if (path !== "/login" && path !== "/register") {
      login.searchParams.set("callbackUrl", withBasePath(path));
    }
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
