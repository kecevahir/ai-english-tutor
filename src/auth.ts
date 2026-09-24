import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  username: z.string().min(3).max(40),
  password: z.string().min(6).max(100),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const username = parsed.data.username.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.displayName || user.username,
          email: user.email ?? undefined,
          username: user.username,
        };
      },
    }),
  ],
});
