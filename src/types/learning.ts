export type CefrLevelCode =
  | "A1"
  | "A2"
  | "B1"
  | "B1+"
  | "B2"
  | "B2+"
  | "C1"
  | "C2";

export type SkillName =
  | "speaking"
  | "listening"
  | "grammar"
  | "vocabulary"
  | "pronunciation"
  | "writing";

export interface SkillBreakdownItem {
  skill: SkillName;
  level: CefrLevelCode;
  score: number;
}

export interface AreaScore {
  name: string;
  score: number;
  slug?: string;
}

export interface DashboardStats {
  overallLevel: CefrLevelCode;
  dailyGoalMinutes: number;
  currentStreak: number;
  wordsLearned: number;
  conversations: number;
  displayName: string;
  englishOnlyMode: boolean;
}

export interface TodaysRecommendation {
  headline: string;
  focusTopics: string[];
  estimatedMinutes: number;
}

export interface DashboardData {
  stats: DashboardStats;
  skills: SkillBreakdownItem[];
  weakAreas: AreaScore[];
  strongAreas: AreaScore[];
  recommendation: TodaysRecommendation;
}
