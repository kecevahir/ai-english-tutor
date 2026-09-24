import { prisma } from "@/lib/database/prisma";

export async function listGrammarProgress(userId: string) {
  return prisma.grammarProgress.findMany({
    where: { userId },
    include: { topic: true },
    orderBy: { masteryLevel: "asc" },
  });
}

export async function listRecentMistakes(userId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.mistake.findMany({
    where: {
      userId,
      createdAt: { gte: since },
    },
    include: { grammarTopic: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTodaysLesson(userId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return prisma.lesson.findFirst({
    where: {
      userId,
      scheduledFor: { gte: start, lte: end },
    },
    include: {
      activities: { orderBy: { sortOrder: "asc" } },
    },
  });
}
