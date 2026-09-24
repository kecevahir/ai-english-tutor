import { prisma } from "@/lib/database/prisma";
import { DEMO_USER_EMAIL } from "@/lib/database/constants";
import type { User, UserProfile, SkillProgress } from "@prisma/client";

export type UserWithProfile = User & {
  profile: UserProfile | null;
  skillProgress: SkillProgress[];
};

export async function getDemoUser(): Promise<UserWithProfile | null> {
  return prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    include: {
      profile: true,
      skillProgress: true,
    },
  });
}

export async function requireDemoUser(): Promise<UserWithProfile> {
  const user = await getDemoUser();
  if (!user || !user.profile) {
    throw new Error(
      "Demo learner not found. Run `npm run db:seed` after migrations.",
    );
  }
  return user;
}

export async function updateEnglishOnlyMode(
  userId: string,
  enabled: boolean,
): Promise<UserProfile> {
  return prisma.userProfile.update({
    where: { userId },
    data: { englishOnlyMode: enabled },
  });
}

export async function updateThemePreference(
  userId: string,
  theme: "LIGHT" | "DARK" | "SYSTEM",
): Promise<UserProfile> {
  return prisma.userProfile.update({
    where: { userId },
    data: { theme },
  });
}
