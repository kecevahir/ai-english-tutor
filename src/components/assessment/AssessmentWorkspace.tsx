"use client";

import { useEffect, useState, useTransition } from "react";
import {
  fetchAssessmentQuestionsAction,
  submitAssessmentAction,
} from "@/app/(app)/assessment/actions";
import type { AssessmentQuestion } from "@/services/assessment/assessmentService";

export function AssessmentWorkspace() {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof submitAssessmentAction>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setQuestions(await fetchAssessmentQuestionsAction());
    });
  }, []);

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      const response = await submitAssessmentAction(answers);
      setResult(response);
      if (!response.ok) setError(response.error);
    });
  }

  if (result?.ok) {
    return (
      <section
        data-testid="assessment-result"
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
      >
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          Overall Level: {result.result.overallLevel}
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {result.result.skills.map((skill) => (
            <li
              key={skill.skill}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            >
              {skill.skill}: {skill.level}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          Results are saved to your learning profile and will shape future
          lessons.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <section
          key={q.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
        >
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            {q.section}
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
            {q.prompt}
          </p>
          {q.options ? (
            <div className="mt-3 space-y-1">
              {q.options.map((option, index) => (
                <label
                  key={option}
                  className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]"
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === index}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: index }))
                    }
                  />
                  {option}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              className="mt-3 min-h-24 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              value={String(answers[q.id] ?? "")}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
              }
            />
          )}
        </section>
      ))}

      {error ? (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        data-testid="submit-assessment"
        disabled={pending}
        onClick={onSubmit}
        className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Submit assessment"}
      </button>
    </div>
  );
}
