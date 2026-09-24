"use server";

import type { VocabularyStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  buildExercise,
  gradeVocabularyAnswer,
  listDueVocabulary,
  listVocabulary,
  type VocabExerciseType,
} from "@/services/vocabulary/vocabularyService";

export async function fetchVocabularyAction(status?: VocabularyStatus) {
  const items = await listVocabulary(status);
  return items.map((item) => ({
    id: item.id,
    status: item.status,
    masteryScore: item.masteryScore,
    reviewCount: item.reviewCount,
    nextReview: item.nextReview?.toISOString() ?? null,
    word: item.vocabulary.word,
    translation: item.vocabulary.translation,
    definition: item.vocabulary.definition,
    exampleSentence: item.vocabulary.exampleSentence,
    category: item.vocabulary.category,
  }));
}

export async function fetchDueExercisesAction() {
  const due = await listDueVocabulary(10);
  const types: VocabExerciseType[] = [
    "TRANSLATION",
    "REVERSE_TRANSLATION",
    "FILL_BLANK",
    "SENTENCE_CREATION",
  ];
  return due.map((item, index) =>
    buildExercise(item, types[index % types.length]!),
  );
}

export async function gradeVocabularyAction(input: {
  progressId: string;
  type: VocabExerciseType;
  answer: string;
}) {
  try {
    const result = await gradeVocabularyAnswer(input);
    revalidatePath("/vocabulary");
    revalidatePath("/review");
    revalidatePath("/dashboard");
    return { ok: true as const, ...result };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Grading failed.",
    };
  }
}
