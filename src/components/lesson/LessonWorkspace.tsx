"use client";

import { useEffect, useState, useTransition } from "react";
import {
  fetchTodaysLessonAction,
  regenerateTodaysLessonAction,
} from "@/app/(app)/lesson/actions";
import Link from "next/link";

type LessonView = Awaited<ReturnType<typeof fetchTodaysLessonAction>>;

export function LessonWorkspace() {
  const [lesson, setLesson] = useState<LessonView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setLesson(await fetchTodaysLessonAction());
    });
  }, []);

  function onRegenerate() {
    setError(null);
    startTransition(async () => {
      const result = await regenerateTodaysLessonAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLesson(result.lesson);
    });
  }

  if (!lesson && pending) {
    return <p className="text-sm text-[var(--muted-foreground)]">Loading lesson…</p>;
  }

  if (!lesson) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        No lesson available.
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {lesson.title}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Estimated time: {lesson.estimatedMinutes} minutes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
            {lesson.status}
          </span>
          <button
            type="button"
            data-testid="regenerate-lesson"
            disabled={pending}
            onClick={onRegenerate}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface)] disabled:opacity-60"
          >
            {pending ? "Updating…" : "Regenerate from profile"}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
          {error}
        </p>
      ) : null}

      {lesson.recommendation ? (
        <p className="whitespace-pre-line text-sm text-[var(--muted-foreground)]">
          {lesson.recommendation}
        </p>
      ) : null}

      <ol className="space-y-3">
        {lesson.activities.map((activity, index) => (
          <li
            key={activity.id}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
          >
            <p className="text-sm font-medium text-[var(--foreground)]">
              {index + 1}. {activity.title}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {activity.estimatedMinutes} minutes
              {activity.description ? ` · ${activity.description}` : ""}
            </p>
            <ActivityLink type={activity.type} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function ActivityLink({ type }: { type: string }) {
  const href =
    type === "VOCABULARY_REVIEW"
      ? "/vocabulary"
      : type === "GRAMMAR"
        ? "/grammar"
        : type === "SPEAKING"
          ? "/speaking"
          : type === "LISTENING"
            ? "/listening"
            : type === "CONVERSATION"
              ? "/conversation"
              : null;
  if (!href) return null;
  return (
    <Link
      href={href}
      className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline"
    >
      Open module
    </Link>
  );
}
