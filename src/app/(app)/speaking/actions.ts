"use server";

import { revalidatePath } from "next/cache";
import {
  listSpeakingSessions,
  startSpeakingSession,
  submitSpeakingAnswer,
} from "@/services/speaking/speakingService";

export async function startSpeakingAction(topic?: string) {
  try {
    const session = await startSpeakingSession(topic);
    return {
      ok: true as const,
      session: {
        id: session.id,
        topic: session.topic,
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to start speaking.",
    };
  }
}

export async function submitSpeakingAction(input: {
  sessionId: string;
  transcript: string;
  durationSeconds: number;
}) {
  try {
    const session = await submitSpeakingAnswer(input);
    revalidatePath("/speaking");
    revalidatePath("/dashboard");
    revalidatePath("/progress");
    return {
      ok: true as const,
      session: {
        id: session.id,
        topic: session.topic,
        grammarNotes: session.grammarNotes,
        fluencyNotes: session.fluencyNotes,
        vocabularyNotes: session.vocabularyNotes,
        pronunciationNotes: session.pronunciationNotes,
        focusArea: session.focusArea,
        durationSeconds: session.durationSeconds,
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to analyze speaking.",
    };
  }
}

export async function listSpeakingAction() {
  const sessions = await listSpeakingSessions();
  return sessions.map((s) => ({
    id: s.id,
    topic: s.topic,
    focusArea: s.focusArea,
    completedAt: s.completedAt?.toISOString() ?? null,
    durationSeconds: s.durationSeconds,
  }));
}
