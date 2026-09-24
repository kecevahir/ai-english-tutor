"use server";

import { revalidatePath } from "next/cache";
import {
  getGrammarDrills,
  gradeGrammarDrill,
  listGrammarMastery,
} from "@/services/grammar/grammarService";

export async function fetchGrammarMasteryAction() {
  const rows = await listGrammarMastery();
  return rows.map((row) => ({
    id: row.id,
    topic: row.topic.name,
    slug: row.topic.slug,
    masteryLevel: row.masteryLevel,
    attempts: row.attempts,
    correctAnswers: row.correctAnswers,
    mistakes: row.mistakes,
    lastPracticed: row.lastPracticed?.toISOString() ?? null,
  }));
}

export async function fetchGrammarDrillsAction() {
  return getGrammarDrills(5);
}

export async function gradeGrammarAction(input: {
  progressId: string;
  answer: string;
  expected: string;
  explanation: string;
}) {
  try {
    const result = await gradeGrammarDrill(input);
    revalidatePath("/grammar");
    revalidatePath("/dashboard");
    revalidatePath("/review");
    return { ok: true as const, ...result };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Grading failed.",
    };
  }
}
