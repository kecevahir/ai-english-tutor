"use server";

import { revalidatePath } from "next/cache";
import {
  getAssessmentQuestions,
  submitAssessment,
} from "@/services/assessment/assessmentService";

export async function fetchAssessmentQuestionsAction() {
  return getAssessmentQuestions();
}

export async function submitAssessmentAction(
  answers: Record<string, string | number>,
) {
  try {
    const result = await submitAssessment(answers);
    revalidatePath("/dashboard");
    revalidatePath("/progress");
    revalidatePath("/settings");
    revalidatePath("/assessment");
    revalidatePath("/lesson");
    return { ok: true as const, result };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "Assessment failed to save.",
    };
  }
}
