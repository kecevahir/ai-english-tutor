import type { NextAuthConfig } from "next-auth";
import { BASE_PATH, withBasePath } from "@/lib/basePath";

function absoluteAppUrl(path: string, baseUrl: string): string {
  const origin = new URL(baseUrl).origin;
  return `${origin}${withBasePath(path)}`;
}

/**
 * Edge-safe auth config (no Prisma / Node APIs).
 * Used by middleware. Full providers live in auth.ts.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: withBasePath("/login"),
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/api/auth");

      if (isPublic) return true;
      return !!auth?.user;
    },
    async redirect({ url, baseUrl }) {
      // Always land under /englishtutor — Auth.js path joins ignore Next basePath
      try {
        if (url.startsWith("http")) {
          const target = new URL(url);
          const origin = new URL(baseUrl).origin;
          if (target.origin !== origin) {
            return absoluteAppUrl("/dashboard", baseUrl);
          }
          if (!target.pathname.startsWith(BASE_PATH)) {
            target.pathname = withBasePath(
              target.pathname === "/" ? "/dashboard" : target.pathname,
            );
          }
          return target.toString();
        }

        const path = url.startsWith("/") ? url : `/${url}`;
        return absoluteAppUrl(
          path.startsWith(BASE_PATH) ? path.slice(BASE_PATH.length) || "/" : path,
          baseUrl,
        );
      } catch {
        return absoluteAppUrl("/dashboard", baseUrl);
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.username = (user as { username?: string }).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.username = (token.username as string) || "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
