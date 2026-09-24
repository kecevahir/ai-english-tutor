import { prisma } from "@/lib/database/prisma";
import { requireCurrentUser } from "@/lib/database/repositories/userRepository";

export type GrammarDrill = {
  progressId: string;
  topicId: string;
  topicName: string;
  prompt: string;
  expected: string;
  explanation: string;
};

const DRILLS: Record<string, Array<{ prompt: string; expected: string; explanation: string }>> = {
  "present-perfect": [
    {
      prompt: "Complete: I _____ (live) here since 2019.",
      expected: "have lived",
      explanation: "Present Perfect + since for a state that started in the past and continues.",
    },
    {
      prompt: "Fix: I have went to London.",
      expected: "I have gone to London",
      explanation: "Use the past participle gone with have.",
    },
  ],
  prepositions: [
    {
      prompt: "Choose: I arrive ___ Monday morning. (in/on/at)",
      expected: "on",
      explanation: "Use on with days and dates.",
    },
  ],
  "past-simple": [
    {
      prompt: "Fix: Yesterday I go to the office.",
      expected: "Yesterday I went to the office",
      explanation: "Finished past time → Past Simple.",
    },
  ],
  articles: [
    {
      prompt: "Complete: She is ___ engineer.",
      expected: "an",
      explanation: "Use an before a vowel sound.",
    },
  ],
};

export async function listGrammarMastery() {
  const user = await requireCurrentUser();
  return prisma.grammarProgress.findMany({
    where: { userId: user.id },
    include: { topic: true },
    orderBy: { masteryLevel: "asc" },
  });
}

export async function getGrammarDrills(limit = 5): Promise<GrammarDrill[]> {
  const progress = await listGrammarMastery();
  const weak = progress.slice(0, 6);
  const drills: GrammarDrill[] = [];

  for (const item of weak) {
    const bank = DRILLS[item.topic.slug] ?? [
      {
        prompt: `Write one correct example sentence using: ${item.topic.name}`,
        expected: item.topic.name,
        explanation: `Practice ${item.topic.name} with a clear example.`,
      },
    ];
    const pick = bank[Math.floor(Math.random() * bank.length)]!;
    drills.push({
      progressId: item.id,
      topicId: item.topicId,
      topicName: item.topic.name,
      prompt: pick.prompt,
      expected: pick.expected,
      explanation: pick.explanation,
    });
    if (drills.length >= limit) break;
  }
  return drills;
}

export async function gradeGrammarDrill(input: {
  progressId: string;
  answer: string;
  expected: string;
  explanation: string;
}) {
  const user = await requireCurrentUser();
  const progress = await prisma.grammarProgress.findFirst({
    where: { id: input.progressId, userId: user.id },
    include: { topic: true },
  });
  if (!progress) {
    throw new Error("Grammar progress not found.");
  }

  const normalize = (value: string) =>
    value.trim().toLowerCase().replace(/[.?!]+$/g, "");
  const isCorrect = normalize(input.answer) === normalize(input.expected);

  const updated = await prisma.grammarProgress.update({
    where: { id: progress.id },
    data: {
      attempts: { increment: 1 },
      correctAnswers: isCorrect ? { increment: 1 } : undefined,
      mistakes: isCorrect ? undefined : { increment: 1 },
      masteryLevel: isCorrect
        ? Math.min(100, progress.masteryLevel + 3)
        : Math.max(0, progress.masteryLevel - 2),
      score: isCorrect
        ? Math.min(100, progress.score + 3)
        : Math.max(0, progress.score - 2),
      lastPracticed: new Date(),
    },
    include: { topic: true },
  });

  await prisma.reviewHistory.create({
    data: {
      userId: user.id,
      itemType: "grammar",
      itemId: progress.id,
      wasCorrect: isCorrect,
      responseMeta: {
        answer: input.answer,
        expected: input.expected,
      },
    },
  });

  return {
    isCorrect,
    feedback: isCorrect
      ? "Correct."
      : `Expected: ${input.expected}. ${input.explanation}`,
    topic: updated.topic.name,
    masteryLevel: updated.masteryLevel,
  };
}
