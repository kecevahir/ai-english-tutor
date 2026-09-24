import { adaptiveLearningEngine } from "@/services/adaptiveLearning/adaptiveLearningEngine";
import { requireCurrentUser } from "@/lib/database/repositories/userRepository";
import {
  getTodaysLesson,
  listGrammarProgress,
} from "@/lib/database/repositories/learningRepository";
import { prisma } from "@/lib/database/prisma";
import { cefrToDisplay } from "@/utils/cn";
import type { DashboardData } from "@/types/learning";

export async function getDashboardData(): Promise<DashboardData> {
  const user = await requireCurrentUser();
  const profile = user.profile!;

  const [grammarProgress, dueVocabCount, todayLesson] = await Promise.all([
    listGrammarProgress(user.id),
    prisma.vocabularyProgress.count({
      where: {
        userId: user.id,
        OR: [{ nextReview: null }, { nextReview: { lte: new Date() } }],
      },
    }),
    getTodaysLesson(user.id),
  ]);

  const weakAreas = adaptiveLearningEngine.getWeakAreas(grammarProgress);
  const strongAreas = adaptiveLearningEngine.getStrongAreas(grammarProgress);
  const skills = adaptiveLearningEngine.calculateSkillLevels(user.skillProgress);

  const recommendation =
    todayLesson?.recommendation
      ? {
          headline: todayLesson.recommendation.split("\n")[0] ?? todayLesson.title,
          focusTopics: todayLesson.activities.map((a) => a.title),
          estimatedMinutes: todayLesson.estimatedMinutes,
        }
      : adaptiveLearningEngine.generateDailyPlanRecommendation({
          weakAreas,
          vocabularyDueCount: dueVocabCount,
          overallLevel: cefrToDisplay(profile.overallLevel),
          estimatedMinutes: profile.dailyGoalMinutes,
        });

  return {
    stats: {
      overallLevel: cefrToDisplay(profile.overallLevel),
      dailyGoalMinutes: profile.dailyGoalMinutes,
      currentStreak: profile.currentStreak,
      wordsLearned: profile.wordsLearnedCount,
      conversations: profile.conversationsCount,
      displayName: user.displayName ?? "Learner",
      englishOnlyMode: profile.englishOnlyMode,
    },
    skills,
    weakAreas,
    strongAreas,
    recommendation,
  };
}
