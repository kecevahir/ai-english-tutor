"use client";

import { useEffect, useState, useTransition } from "react";
import type { VocabularyStatus } from "@prisma/client";
import {
  fetchDueExercisesAction,
  fetchVocabularyAction,
  gradeVocabularyAction,
} from "@/app/(app)/vocabulary/actions";
import type { VocabExerciseType } from "@/services/vocabulary/vocabularyService";
import { cn } from "@/utils/cn";

type VocabRow = Awaited<ReturnType<typeof fetchVocabularyAction>>[number];
type Exercise = Awaited<ReturnType<typeof fetchDueExercisesAction>>[number];

const STATUS_FILTERS: Array<{ value: VocabularyStatus | "ALL"; label: string }> =
  [
    { value: "ALL", label: "All" },
    { value: "NEW", label: "New" },
    { value: "LEARNING", label: "Learning" },
    { value: "FAMILIAR", label: "Familiar" },
    { value: "MASTERED", label: "Mastered" },
  ];

export function VocabularyWorkspace() {
  const [filter, setFilter] = useState<VocabularyStatus | "ALL">("ALL");
  const [rows, setRows] = useState<VocabRow[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reload(nextFilter = filter) {
    startTransition(async () => {
      const [list, due] = await Promise.all([
        fetchVocabularyAction(nextFilter === "ALL" ? undefined : nextFilter),
        fetchDueExercisesAction(),
      ]);
      setRows(list);
      setExercises(due);
      setIndex(0);
      setAnswer("");
      setFeedback(null);
    });
  }

  useEffect(() => {
    reload("ALL");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = exercises[index];

  function onGrade() {
    if (!current) return;
    setError(null);
    startTransition(async () => {
      const result = await gradeVocabularyAction({
        progressId: current.progressId,
        type: current.type,
        answer,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFeedback(
        `${result.isCorrect ? "✓" : "✗"} ${result.feedback}${
          result.correctedAnswer && !result.isCorrect
            ? ` (${result.correctedAnswer})`
            : ""
        }`,
      );
      const list = await fetchVocabularyAction(
        filter === "ALL" ? undefined : filter,
      );
      setRows(list);
    });
  }

  function onNext() {
    setFeedback(null);
    setAnswer("");
    setIndex((value) => value + 1);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Word bank
          </h2>
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setFilter(item.value);
                  reload(item.value);
                }}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs",
                  filter === item.value
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "bg-[var(--surface)] text-[var(--muted-foreground)]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            No words yet. End conversations to extract vocabulary.
          </p>
        ) : (
          <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-[var(--foreground)]">
                    {row.word}
                  </p>
                  <span className="text-xs text-[var(--muted)]">{row.status}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {row.translation ?? row.definition ?? "—"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Mastery {Math.round(row.masteryScore)}%
                  {row.nextReview
                    ? ` · next ${new Date(row.nextReview).toLocaleDateString()}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Words Due Today
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          SRS practice — translation, reverse, fill-blank, sentence creation.
        </p>

        {!current ? (
          <p className="mt-6 text-sm text-[var(--muted-foreground)]">
            No words due right now.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              {labelForType(current.type)} · {index + 1}/{exercises.length}
            </p>
            <p className="text-lg font-semibold text-[var(--foreground)]">
              {current.prompt}
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">{current.hint}</p>
            <textarea
              data-testid="vocab-answer"
              className="min-h-24 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={pending || Boolean(feedback)}
            />
            {feedback ? (
              <p
                data-testid="vocab-feedback"
                className="text-sm text-[var(--foreground)]"
              >
                {feedback}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
                {error}
              </p>
            ) : null}
            <div className="flex gap-2">
              {!feedback ? (
                <button
                  type="button"
                  data-testid="vocab-check"
                  disabled={pending || !answer.trim()}
                  onClick={onGrade}
                  className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {pending ? "Checking…" : "Check"}
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="vocab-next"
                  onClick={onNext}
                  className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function labelForType(type: VocabExerciseType): string {
  switch (type) {
    case "TRANSLATION":
      return "Translation";
    case "REVERSE_TRANSLATION":
      return "Reverse translation";
    case "FILL_BLANK":
      return "Fill the blank";
    case "SENTENCE_CREATION":
      return "Sentence creation";
  }
}
