import { CefrLevel, SkillType, type User, type UserProfile, type SkillProgress } from "@prisma/client";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/database/prisma";
import { DEMO_USER_EMAIL } from "@/lib/database/constants";

export type UserWithProfile = User & {
  profile: UserProfile | null;
  skillProgress: SkillProgress[];
};

function includeProfile() {
  return {
    profile: true,
    skillProgress: true,
  } as const;
}

export async function getUserById(id: string): Promise<UserWithProfile | null> {
  return prisma.user.findUnique({
    where: { id },
    include: includeProfile(),
  });
}

export async function getUserByUsername(
  username: string,
): Promise<UserWithProfile | null> {
  return prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
    include: includeProfile(),
  });
}

/** @deprecated Prefer requireCurrentUser — kept for scripts/tests. */
export async function getDemoUser(): Promise<UserWithProfile | null> {
  return prisma.user.findFirst({
    where: {
      OR: [{ email: DEMO_USER_EMAIL }, { username: "demo" }],
    },
    include: includeProfile(),
  });
}

/** @deprecated Prefer requireCurrentUser — kept for scripts/tests. */
export async function requireDemoUser(): Promise<UserWithProfile> {
  const user = await getDemoUser();
  if (!user || !user.profile) {
    throw new Error(
      "Demo learner not found. Run `npm run db:seed` after migrations.",
    );
  }
  return user;
}

export async function requireCurrentUser(): Promise<UserWithProfile> {
  const session = await auth();
  const userId = session?.user?.id;
  if (userId) {
    const user = await getUserById(userId);
    if (!user || !user.profile) {
      throw new Error("User profile missing");
    }
    return user;
  }

  // Local scripts / e2e only — never set in production
  if (process.env.ALLOW_DEMO_USER === "1") {
    return requireDemoUser();
  }

  throw new Error("Unauthorized");
}

export async function createLearnerAccount(input: {
  username: string;
  password: string;
  displayName?: string;
}): Promise<UserWithProfile> {
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(username)) {
    throw new Error(
      "Username must be 3–32 chars: letters, numbers, underscore.",
    );
  }
  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw new Error("Username already taken.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.create({
    data: {
      username,
      passwordHash,
      displayName: input.displayName?.trim() || username,
      profile: {
        create: {
          overallLevel: CefrLevel.A2,
          dailyGoalMinutes: 20,
          currentStreak: 0,
          longestStreak: 0,
          assessmentCompleted: false,
          wordsLearnedCount: 0,
          conversationsCount: 0,
          speakingMinutes: 0,
          lessonsCompleted: 0,
          englishOnlyMode: false,
          theme: "SYSTEM",
        },
      },
      skillProgress: {
        create: Object.values(SkillType).map((skill) => ({
          skill,
          level: CefrLevel.A2,
          score: 40,
        })),
      },
    },
    include: includeProfile(),
  });
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
