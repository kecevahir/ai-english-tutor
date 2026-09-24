"use client";

import { useEffect, useState, useTransition } from "react";
import {
  fetchGrammarDrillsAction,
  fetchGrammarMasteryAction,
  gradeGrammarAction,
} from "@/app/(app)/grammar/actions";
import { formatPercent } from "@/utils/cn";

type MasteryRow = Awaited<ReturnType<typeof fetchGrammarMasteryAction>>[number];
type Drill = Awaited<ReturnType<typeof fetchGrammarDrillsAction>>[number];

export function GrammarWorkspace() {
  const [rows, setRows] = useState<MasteryRow[]>([]);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reload() {
    startTransition(async () => {
      const [mastery, nextDrills] = await Promise.all([
        fetchGrammarMasteryAction(),
        fetchGrammarDrillsAction(),
      ]);
      setRows(mastery);
      setDrills(nextDrills);
      setIndex(0);
      setAnswer("");
      setFeedback(null);
    });
  }

  useEffect(() => {
    reload();
  }, []);

  const current = drills[index];

  function onCheck() {
    if (!current) return;
    setError(null);
    startTransition(async () => {
      const result = await gradeGrammarAction({
        progressId: current.progressId,
        answer,
        expected: current.expected,
        explanation: current.explanation,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFeedback(
        `${result.isCorrect ? "✓" : "✗"} ${result.feedback} · Mastery ${Math.round(result.masteryLevel)}%`,
      );
      setRows(await fetchGrammarMasteryAction());
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Grammar mastery
        </h2>
        <ul className="mt-4 max-h-[30rem] space-y-2 overflow-y-auto">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {row.topic}
                </p>
                <span
                  className={
                    row.masteryLevel < 65
                      ? "text-sm font-medium text-amber-700 dark:text-amber-300"
                      : "text-sm font-medium text-teal-700 dark:text-teal-300"
                  }
                >
                  {formatPercent(row.masteryLevel)}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Attempts {row.attempts} · Correct {row.correctAnswers} · Mistakes{" "}
                {row.mistakes}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Practice weak topics
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Drills prioritize lowest mastery first.
        </p>

        {!current ? (
          <p className="mt-6 text-sm text-[var(--muted-foreground)]">
            No drills available.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              {current.topicName} · {index + 1}/{drills.length}
            </p>
            <p className="text-base font-medium text-[var(--foreground)]">
              {current.prompt}
            </p>
            <input
              data-testid="grammar-answer"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={pending || Boolean(feedback)}
            />
            {feedback ? (
              <p data-testid="grammar-feedback" className="text-sm">
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
                  data-testid="grammar-check"
                  disabled={pending || !answer.trim()}
                  onClick={onCheck}
                  className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  Check
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFeedback(null);
                    setAnswer("");
                    setIndex((value) => value + 1);
                  }}
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
