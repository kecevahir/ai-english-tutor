import { CefrLevel, SkillType } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { requireCurrentUser } from "@/lib/database/repositories/userRepository";
import { cefrToDisplay } from "@/utils/cn";

export type AssessmentSection =
  | "vocabulary"
  | "grammar"
  | "reading"
  | "writing"
  | "speaking";

export type AssessmentQuestion = {
  id: string;
  section: AssessmentSection;
  prompt: string;
  options?: string[];
  correctIndex?: number;
};

const QUESTIONS: AssessmentQuestion[] = [
  {
    id: "v1",
    section: "vocabulary",
    prompt: "What does 'deadline' mean?",
    options: [
      "A type of phone",
      "A due date for work",
      "A travel ticket",
      "A kitchen tool",
    ],
    correctIndex: 1,
  },
  {
    id: "g1",
    section: "grammar",
    prompt: "Choose the correct sentence.",
    options: [
      "She go to work every day.",
      "She goes to work every day.",
      "She going to work every day.",
      "She gone to work every day.",
    ],
    correctIndex: 1,
  },
  {
    id: "g2",
    section: "grammar",
    prompt: "I _____ in this city since 2018.",
    options: ["live", "lived", "have lived", "am live"],
    correctIndex: 2,
  },
  {
    id: "r1",
    section: "reading",
    prompt:
      "Short text: 'Maya missed her bus because she left home late.' Why did Maya miss the bus?",
    options: [
      "The bus broke down",
      "She left home late",
      "She lost her ticket",
      "It was cancelled",
    ],
    correctIndex: 1,
  },
  {
    id: "w1",
    section: "writing",
    prompt: "Write 2–3 sentences about your typical working day.",
  },
  {
    id: "s1",
    section: "speaking",
    prompt: "What did you do last weekend? (type your spoken answer)",
  },
];

export function getAssessmentQuestions() {
  return QUESTIONS;
}

function scoreToLevel(score: number): CefrLevel {
  if (score >= 90) return CefrLevel.C1;
  if (score >= 80) return CefrLevel.B2_PLUS;
  if (score >= 70) return CefrLevel.B2;
  if (score >= 60) return CefrLevel.B1_PLUS;
  if (score >= 50) return CefrLevel.B1;
  if (score >= 35) return CefrLevel.A2;
  return CefrLevel.A1;
}

function wordCountScore(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(100, words * 8);
}

export async function submitAssessment(
  answers: Record<string, string | number>,
) {
  const user = await requireCurrentUser();

  let objectiveCorrect = 0;
  let objectiveTotal = 0;
  for (const question of QUESTIONS) {
    if (question.correctIndex == null) continue;
    objectiveTotal += 1;
    if (answers[question.id] === question.correctIndex) objectiveCorrect += 1;
  }

  const writingScore = wordCountScore(String(answers.w1 ?? ""));
  const speakingScore = wordCountScore(String(answers.s1 ?? ""));
  const objectiveScore =
    objectiveTotal === 0 ? 0 : (objectiveCorrect / objectiveTotal) * 100;
  const overallScore = Math.round(
    objectiveScore * 0.5 + writingScore * 0.25 + speakingScore * 0.25,
  );
  const overallLevel = scoreToLevel(overallScore);

  const updates: Array<{ skill: SkillType; level: CefrLevel; score: number }> =
    [
      {
        skill: SkillType.VOCABULARY,
        level: scoreToLevel(objectiveScore),
        score: objectiveScore,
      },
      {
        skill: SkillType.GRAMMAR,
        level: scoreToLevel(objectiveScore),
        score: objectiveScore,
      },
      {
        skill: SkillType.LISTENING,
        level: scoreToLevel(Math.max(objectiveScore - 5, 0)),
        score: Math.max(objectiveScore - 5, 0),
      },
      {
        skill: SkillType.WRITING,
        level: scoreToLevel(writingScore),
        score: writingScore,
      },
      {
        skill: SkillType.SPEAKING,
        level: scoreToLevel(speakingScore),
        score: speakingScore,
      },
      {
        skill: SkillType.PRONUNCIATION,
        level: scoreToLevel(Math.max(speakingScore - 5, 0)),
        score: Math.max(speakingScore - 5, 0),
      },
    ];

  for (const item of updates) {
    await prisma.skillProgress.upsert({
      where: {
        userId_skill: { userId: user.id, skill: item.skill },
      },
      create: {
        userId: user.id,
        skill: item.skill,
        level: item.level,
        score: item.score,
        lastPracticed: new Date(),
      },
      update: {
        level: item.level,
        score: item.score,
        lastPracticed: new Date(),
      },
    });
  }

  await prisma.userProfile.update({
    where: { userId: user.id },
    data: {
      overallLevel,
      assessmentCompleted: true,
    },
  });

  return {
    overallLevel: cefrToDisplay(overallLevel),
    skills: updates.map((u) => ({
      skill: u.skill,
      level: cefrToDisplay(u.level),
      score: Math.round(u.score),
    })),
    objectiveScore: Math.round(objectiveScore),
    writingScore: Math.round(writingScore),
    speakingScore: Math.round(speakingScore),
  };
}
