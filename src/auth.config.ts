import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no Prisma / Node APIs).
 * Used by middleware. Full providers live in auth.ts.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
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
