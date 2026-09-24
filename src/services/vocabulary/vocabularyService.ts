import type { VocabularyStatus } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { requireDemoUser } from "@/lib/database/repositories/userRepository";
import { nextReviewDate } from "@/lib/srs/schedule";
import { createAIProvider } from "@/services/ai";
import { cefrToDisplay } from "@/utils/cn";

export type VocabExerciseType =
  | "TRANSLATION"
  | "REVERSE_TRANSLATION"
  | "FILL_BLANK"
  | "SENTENCE_CREATION";

export async function listVocabulary(status?: VocabularyStatus) {
  const user = await requireDemoUser();
  return prisma.vocabularyProgress.findMany({
    where: {
      userId: user.id,
      ...(status ? { status } : {}),
    },
    include: { vocabulary: true },
    orderBy: [{ status: "asc" }, { nextReview: "asc" }],
  });
}

export async function listDueVocabulary(limit = 12) {
  const user = await requireDemoUser();
  return prisma.vocabularyProgress.findMany({
    where: {
      userId: user.id,
      OR: [{ nextReview: null }, { nextReview: { lte: new Date() } }],
    },
    include: { vocabulary: true },
    orderBy: { nextReview: "asc" },
    take: limit,
  });
}

export function buildExercise(
  item: Awaited<ReturnType<typeof listDueVocabulary>>[number],
  type: VocabExerciseType,
) {
  const word = item.vocabulary;
  switch (type) {
    case "TRANSLATION":
      return {
        type,
        progressId: item.id,
        prompt: word.word,
        hint: "Türkçesi nedir?",
        expected: word.translation ?? undefined,
      };
    case "REVERSE_TRANSLATION":
      return {
        type,
        progressId: item.id,
        prompt: word.translation ?? word.definition ?? word.word,
        hint: "İngilizcesi nedir?",
        expected: word.word,
      };
    case "FILL_BLANK": {
      const sentence =
        word.exampleSentence ?? `I need to practice the word "${word.word}".`;
      const blanked = sentence.replace(
        new RegExp(word.word, "i"),
        "______",
      );
      return {
        type,
        progressId: item.id,
        prompt: blanked,
        hint: "Fill the blank",
        expected: word.word,
      };
    }
    case "SENTENCE_CREATION":
      return {
        type,
        progressId: item.id,
        prompt: word.word,
        hint: `Create a sentence using: ${word.word}`,
        expected: undefined,
      };
  }
}

export async function gradeVocabularyAnswer(input: {
  progressId: string;
  type: VocabExerciseType;
  answer: string;
}) {
  const user = await requireDemoUser();
  const profile = user.profile!;
  const progress = await prisma.vocabularyProgress.findFirst({
    where: { id: input.progressId, userId: user.id },
    include: { vocabulary: true },
  });
  if (!progress) {
    throw new Error("Vocabulary item not found.");
  }

  const answer = input.answer.trim();
  if (!answer) {
    throw new Error("Answer cannot be empty.");
  }

  let isCorrect = false;
  let feedback = "";
  let correctedAnswer: string | undefined;

  if (input.type === "SENTENCE_CREATION") {
    const provider = createAIProvider();
    const result = await provider.evaluateAnswer({
      prompt: `Create a natural English sentence using the word "${progress.vocabulary.word}".`,
      answer,
      learnerLevel: cefrToDisplay(profile.overallLevel),
    });
    // Mock cannot fully grade freeform; accept if word is used.
    const usesWord = new RegExp(`\\b${progress.vocabulary.word}\\b`, "i").test(
      answer,
    );
    isCorrect = provider.name === "mock" ? usesWord : result.isCorrect;
    feedback =
      provider.name === "mock"
        ? usesWord
          ? "Word used correctly in your sentence (mock check)."
          : `Include the word "${progress.vocabulary.word}" in your sentence.`
        : result.feedback;
    correctedAnswer = result.correctedAnswer;
  } else {
    const expected =
      input.type === "TRANSLATION"
        ? progress.vocabulary.translation
        : progress.vocabulary.word;
    if (!expected) {
      isCorrect = true;
      feedback = "No expected answer stored; marked for review scheduling only.";
    } else {
      isCorrect =
        answer.toLocaleLowerCase("tr-TR") ===
        expected.toLocaleLowerCase("tr-TR");
      feedback = isCorrect
        ? "Correct."
        : `Expected: ${expected}`;
      correctedAnswer = expected;
    }
  }

  const correctStreak = isCorrect
    ? Math.min(progress.correctCount + 1, 5)
    : 0;
  const nextStatus = isCorrect
    ? progress.masteryScore >= 80 || progress.correctCount + 1 >= 4
      ? "MASTERED"
      : progress.correctCount + 1 >= 2
        ? "FAMILIAR"
        : "LEARNING"
    : "LEARNING";

  const updated = await prisma.vocabularyProgress.update({
    where: { id: progress.id },
    data: {
      reviewCount: { increment: 1 },
      correctCount: isCorrect ? { increment: 1 } : undefined,
      incorrectCount: isCorrect ? undefined : { increment: 1 },
      lastReviewed: new Date(),
      nextReview: isCorrect ? nextReviewDate(correctStreak) : nextReviewDate(0),
      masteryScore: isCorrect
        ? Math.min(100, progress.masteryScore + 10)
        : Math.max(0, progress.masteryScore - 15),
      status: nextStatus,
    },
    include: { vocabulary: true },
  });

  await prisma.reviewHistory.create({
    data: {
      userId: user.id,
      itemType: "vocabulary",
      itemId: progress.id,
      wasCorrect: isCorrect,
      responseMeta: {
        type: input.type,
        answer,
        feedback,
      },
    },
  });

  if (isCorrect && progress.status === "NEW") {
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: { wordsLearnedCount: { increment: 1 } },
    });
  }

  return {
    isCorrect,
    feedback,
    correctedAnswer,
    progress: {
      id: updated.id,
      status: updated.status,
      masteryScore: updated.masteryScore,
      nextReview: updated.nextReview?.toISOString() ?? null,
      word: updated.vocabulary.word,
      translation: updated.vocabulary.translation,
    },
  };
}
