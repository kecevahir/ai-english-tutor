import type { CefrLevel, GrammarProgress, GrammarTopic, SkillProgress } from "@prisma/client";
import type {
  AreaScore,
  CefrLevelCode,
  SkillBreakdownItem,
  SkillName,
  TodaysRecommendation,
} from "@/types/learning";
import { cefrToDisplay } from "@/utils/cn";

type GrammarProgressWithTopic = GrammarProgress & { topic: GrammarTopic };

const SKILL_MAP: Record<string, SkillName> = {
  SPEAKING: "speaking",
  LISTENING: "listening",
  GRAMMAR: "grammar",
  VOCABULARY: "vocabulary",
  PRONUNCIATION: "pronunciation",
  WRITING: "writing",
};

export function getWeakAreas(
  progress: GrammarProgressWithTopic[],
  limit = 4,
): AreaScore[] {
  return [...progress]
    .sort((a, b) => a.masteryLevel - b.masteryLevel)
    .slice(0, limit)
    .map((item) => ({
      name: item.topic.name,
      slug: item.topic.slug,
      score: item.masteryLevel,
    }));
}

export function getStrongAreas(
  progress: GrammarProgressWithTopic[],
  limit = 4,
): AreaScore[] {
  return [...progress]
    .sort((a, b) => b.masteryLevel - a.masteryLevel)
    .slice(0, limit)
    .map((item) => ({
      name: item.topic.name,
      slug: item.topic.slug,
      score: item.masteryLevel,
    }));
}

export function calculateSkillLevels(
  skills: SkillProgress[],
): SkillBreakdownItem[] {
  const order: SkillName[] = [
    "speaking",
    "listening",
    "grammar",
    "vocabulary",
    "pronunciation",
  ];

  const byName = new Map(
    skills.map((s) => [SKILL_MAP[s.skill] ?? "grammar", s] as const),
  );

  return order.map((skill) => {
    const row = byName.get(skill);
    return {
      skill,
      level: row ? cefrToDisplay(row.level) : ("B1" as CefrLevelCode),
      score: row?.score ?? 0,
    };
  });
}

export function selectGrammarTopics(
  weakAreas: AreaScore[],
  limit = 2,
): string[] {
  return weakAreas.slice(0, limit).map((a) => a.name);
}

export function selectVocabulary(
  dueWords: string[],
  limit = 8,
): string[] {
  return dueWords.slice(0, limit);
}

export function calculateDifficulty(
  overallLevel: CefrLevel,
  recentAccuracy: number,
): "EASY" | "NORMAL" | "CHALLENGING" {
  if (recentAccuracy < 0.55) return "EASY";
  if (recentAccuracy > 0.85 && ["B2", "B2_PLUS", "C1", "C2"].includes(overallLevel)) {
    return "CHALLENGING";
  }
  return "NORMAL";
}

export function generateDailyPlanRecommendation(input: {
  weakAreas: AreaScore[];
  vocabularyDueCount: number;
  overallLevel: CefrLevelCode;
  estimatedMinutes?: number;
}): TodaysRecommendation {
  const primary = input.weakAreas[0];
  const secondary = input.weakAreas[1];
  const focusTopics: string[] = [];

  if (primary) {
    focusTopics.push(primary.name);
    if (secondary) {
      focusTopics.push(`${primary.name} vs related forms`);
    }
  } else {
    focusTopics.push("General conversation fluency");
  }

  focusTopics.push("Conversation practice");
  focusTopics.push(
    `${Math.max(input.vocabularyDueCount, 8)} vocabulary reviews`,
  );

  const headline = primary
    ? `You have been struggling with ${primary.name}.`
    : `Continue building fluency at ${input.overallLevel}.`;

  return {
    headline,
    focusTopics,
    estimatedMinutes: input.estimatedMinutes ?? 25,
  };
}

/** Facade used by higher-level services */
export const adaptiveLearningEngine = {
  getWeakAreas,
  getStrongAreas,
  calculateSkillLevels,
  selectGrammarTopics,
  selectVocabulary,
  calculateDifficulty,
  generateDailyPlanRecommendation,
};
