"use server";

import { revalidatePath } from "next/cache";
import {
  generateTodaysLesson,
  getOrCreateTodaysLesson,
} from "@/services/lesson/lessonService";

export async function fetchTodaysLessonAction() {
  const lesson = await getOrCreateTodaysLesson();
  return {
    id: lesson.id,
    title: lesson.title,
    estimatedMinutes: lesson.estimatedMinutes,
    status: lesson.status,
    recommendation: lesson.recommendation,
    activities: lesson.activities.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      estimatedMinutes: a.estimatedMinutes,
      completed: a.completed,
    })),
  };
}

export async function regenerateTodaysLessonAction() {
  try {
    const lesson = await generateTodaysLesson();
    revalidatePath("/lesson");
    revalidatePath("/dashboard");
    return {
      ok: true as const,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        estimatedMinutes: lesson.estimatedMinutes,
        status: lesson.status,
        recommendation: lesson.recommendation,
        activities: lesson.activities.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description,
          estimatedMinutes: a.estimatedMinutes,
          completed: a.completed,
        })),
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "Failed to generate lesson.",
    };
  }
}
