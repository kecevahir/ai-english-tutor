import { prisma } from "@/lib/database/prisma";
import { requireDemoUser } from "@/lib/database/repositories/userRepository";
import { listGrammarProgress } from "@/lib/database/repositories/learningRepository";
import { adaptiveLearningEngine } from "@/services/adaptiveLearning/adaptiveLearningEngine";
import { cefrToDisplay } from "@/utils/cn";

export type ProgressRange = "7d" | "30d" | "90d" | "all";

function rangeStart(range: ProgressRange): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function getProgressOverview(range: ProgressRange = "30d") {
  const user = await requireDemoUser();
  const profile = user.profile!;
  const since = rangeStart(range);

  const createdFilter = since ? { gte: since } : undefined;

  const [
    grammarProgress,
    mistakes,
    reviews,
    conversations,
    speakingSessions,
    listeningSessions,
    lessons,
    vocabLearned,
  ] = await Promise.all([
    listGrammarProgress(user.id),
    prisma.mistake.findMany({
      where: { userId: user.id, createdAt: createdFilter },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { grammarTopic: true },
    }),
    prisma.reviewHistory.findMany({
      where: { userId: user.id, reviewedAt: createdFilter },
    }),
    prisma.conversation.count({
      where: { userId: user.id, startedAt: createdFilter },
    }),
    prisma.speakingSession.findMany({
      where: { userId: user.id, createdAt: createdFilter },
    }),
    prisma.listeningSession.findMany({
      where: { userId: user.id, createdAt: createdFilter },
    }),
    prisma.lesson.count({
      where: {
        userId: user.id,
        status: "COMPLETED",
        completedAt: createdFilter,
      },
    }),
    prisma.vocabularyProgress.count({
      where: {
        userId: user.id,
        status: { in: ["FAMILIAR", "MASTERED"] },
        updatedAt: createdFilter,
      },
    }),
  ]);

  const weak = adaptiveLearningEngine.getWeakAreas(grammarProgress, 5);
  const strong = adaptiveLearningEngine.getStrongAreas(grammarProgress, 5);
  const skills = adaptiveLearningEngine.calculateSkillLevels(user.skillProgress);

  const speakingMinutes = speakingSessions.reduce(
    (sum, s) => sum + Math.round(s.durationSeconds / 60),
    0,
  );
  const reviewCorrect = reviews.filter((r) => r.wasCorrect).length;
  const reviewAccuracy =
    reviews.length === 0 ? 0 : Math.round((reviewCorrect / reviews.length) * 100);

  return {
    overallLevel: cefrToDisplay(profile.overallLevel),
    skills,
    weakAreas: weak,
    strongAreas: strong,
    mostImproved: strong.slice(0, 3),
    needsAttention: weak.slice(0, 3),
    recentMistakes: mistakes.map((m) => ({
      id: m.id,
      original: m.originalSentence,
      corrected: m.correctedSentence,
      category: m.subCategory ?? m.category,
    })),
    stats: {
      conversations,
      speakingMinutes: speakingMinutes || profile.speakingMinutes,
      lessonsCompleted: lessons || profile.lessonsCompleted,
      wordsLearned: vocabLearned || profile.wordsLearnedCount,
      reviewAccuracy,
      listeningSessions: listeningSessions.length,
    },
  };
}

export async function buildWeeklyReport() {
  const overview = await getProgressOverview("7d");
  const topMistake = overview.recentMistakes[0];
  return {
    title: "WEEKLY ENGLISH REPORT",
    studyHint: `${overview.stats.speakingMinutes} speaking minutes · ${overview.stats.conversations} conversations`,
    vocabulary: `${overview.stats.wordsLearned} words progressed`,
    mainImprovement: overview.mostImproved[0]?.name ?? "Consistency",
    needsAttention: overview.needsAttention.map((a) => a.name),
    repeatedMistake: topMistake
      ? {
          wrong: topMistake.original,
          correct: topMistake.corrected,
        }
      : null,
    nextWeekFocus: [
      overview.needsAttention[0]?.name ?? "Present Perfect",
      "Travel conversation",
      overview.needsAttention[1]?.name ?? "Prepositions",
    ],
  };
}
