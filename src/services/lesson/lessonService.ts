import { LessonActivityType, LessonStatus } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { requireDemoUser } from "@/lib/database/repositories/userRepository";
import { listGrammarProgress } from "@/lib/database/repositories/learningRepository";
import { adaptiveLearningEngine } from "@/services/adaptiveLearning/adaptiveLearningEngine";
import { createAIProvider } from "@/services/ai";
import { cefrToDisplay } from "@/utils/cn";
import { listDueVocabulary } from "@/services/vocabulary/vocabularyService";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export async function getOrCreateTodaysLesson() {
  const user = await requireDemoUser();
  const existing = await prisma.lesson.findFirst({
    where: {
      userId: user.id,
      scheduledFor: { gte: startOfDay(), lte: endOfDay() },
    },
    include: { activities: { orderBy: { sortOrder: "asc" } } },
  });
  if (existing) return existing;
  return generateTodaysLesson();
}

export async function generateTodaysLesson() {
  const user = await requireDemoUser();
  const profile = user.profile!;
  const [grammarProgress, dueVocab, recentMistakes] = await Promise.all([
    listGrammarProgress(user.id),
    listDueVocabulary(12),
    prisma.mistake.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const weakAreas = adaptiveLearningEngine.getWeakAreas(grammarProgress);
  const strongAreas = adaptiveLearningEngine.getStrongAreas(grammarProgress);
  const selectedGrammar = adaptiveLearningEngine.selectGrammarTopics(weakAreas, 2);
  const selectedVocab = adaptiveLearningEngine.selectVocabulary(
    dueVocab.map((item) => item.vocabulary.word),
    8,
  );

  const provider = createAIProvider();
  const plan = await provider.generateLesson({
    learnerLevel: cefrToDisplay(profile.overallLevel),
    weakAreas: selectedGrammar,
    strongAreas: strongAreas.map((a) => a.name),
    vocabularyDue: selectedVocab,
    recentMistakeCategories: [
      ...new Set(recentMistakes.map((m) => m.subCategory ?? m.category)),
    ],
  });

  const recommendation =
    adaptiveLearningEngine.generateDailyPlanRecommendation({
      weakAreas,
      vocabularyDueCount: selectedVocab.length,
      overallLevel: cefrToDisplay(profile.overallLevel),
      estimatedMinutes: plan.estimatedMinutes || profile.dailyGoalMinutes,
    });

  // Replace any existing today lesson
  await prisma.lessonActivity.deleteMany({
    where: {
      lesson: {
        userId: user.id,
        scheduledFor: { gte: startOfDay(), lte: endOfDay() },
      },
    },
  });
  await prisma.lesson.deleteMany({
    where: {
      userId: user.id,
      scheduledFor: { gte: startOfDay(), lte: endOfDay() },
    },
  });

  const scheduledFor = startOfDay();
  scheduledFor.setHours(9, 0, 0, 0);

  return prisma.lesson.create({
    data: {
      userId: user.id,
      title: plan.title || "Today's Lesson",
      estimatedMinutes: plan.estimatedMinutes || profile.dailyGoalMinutes,
      status: LessonStatus.PLANNED,
      scheduledFor,
      recommendation: [
        recommendation.headline,
        "Today's lesson will focus on:",
        ...recommendation.focusTopics.map((t) => `• ${t}`),
        plan.recommendation,
      ].join("\n"),
      activities: {
        create: plan.activities.map((activity, index) => ({
          type: activity.type as LessonActivityType,
          title: activity.title,
          description: activity.description,
          estimatedMinutes: activity.estimatedMinutes,
          sortOrder: index + 1,
        })),
      },
    },
    include: { activities: { orderBy: { sortOrder: "asc" } } },
  });
}
