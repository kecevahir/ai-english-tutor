"use server";

import { revalidatePath } from "next/cache";
import {
  completeListeningSession,
  createListeningSession,
  listListeningSessions,
} from "@/services/listening/listeningService";

export async function startListeningAction() {
  try {
    const { session, questions } = await createListeningSession();
    return {
      ok: true as const,
      session: {
        id: session.id,
        title: session.title,
        level: session.level,
        durationSeconds: session.durationSeconds,
        transcript: session.transcript,
      },
      questions,
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "Failed to start listening.",
    };
  }
}

export async function completeListeningAction(input: {
  sessionId: string;
  answers: number[];
  questions: Array<{
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
  }>;
}) {
  try {
    const result = await completeListeningSession(input);
    revalidatePath("/listening");
    revalidatePath("/vocabulary");
    revalidatePath("/progress");
    return { ok: true as const, ...result, sessionId: result.session.id, score: result.score };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "Failed to complete listening.",
    };
  }
}

export async function listListeningAction() {
  const sessions = await listListeningSessions();
  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    score: s.score,
    completedAt: s.completedAt?.toISOString() ?? null,
  }));
}
