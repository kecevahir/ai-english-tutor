"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  completeListeningAction,
  listListeningAction,
  startListeningAction,
} from "@/app/(app)/listening/actions";
import { createWebTextToSpeechProvider } from "@/services/speech/webSpeech";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export function ListeningWorkspace() {
  const [session, setSession] = useState<{
    id: string;
    title: string;
    durationSeconds: number;
    transcript: string | null;
  } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correct: number;
    total: number;
  } | null>(null);
  const [history, setHistory] = useState<
    Awaited<ReturnType<typeof listListeningAction>>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ttsRef = useRef(createWebTextToSpeechProvider());

  useEffect(() => {
    startTransition(async () => setHistory(await listListeningAction()));
  }, []);

  function onStart() {
    setError(null);
    setResult(null);
    setShowTranscript(false);
    startTransition(async () => {
      const response = await startListeningAction();
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setSession(response.session);
      setQuestions(response.questions);
      setAnswers(response.questions.map(() => -1));
    });
  }

  async function onPlay() {
    if (!session?.transcript) return;
    setError(null);
    try {
      if (!ttsRef.current.isSupported()) {
        setError(
          "Text-to-speech is unavailable here. You can still answer from the transcript after revealing it.",
        );
        return;
      }
      await ttsRef.current.speak(session.transcript.replace(/\n/g, ". "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Playback failed.");
    }
  }

  function onSubmit() {
    if (!session) return;
    if (answers.some((a) => a < 0)) {
      setError("Answer every question before submitting.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const response = await completeListeningAction({
        sessionId: session.id,
        answers,
        questions,
      });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setResult({
        score: response.score,
        correct: response.correct,
        total: response.total,
      });
      setHistory(await listListeningAction());
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Listening practice
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Listen, answer comprehension questions, then reveal the transcript.
            </p>
          </div>
          <button
            type="button"
            data-testid="start-listening"
            onClick={onStart}
            disabled={pending}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            New audio lesson
          </button>
        </div>

        {session ? (
          <div className="mt-4 space-y-3">
            <p className="font-medium text-[var(--foreground)]">{session.title}</p>
            <p className="text-xs text-[var(--muted)]">
              Duration ~{Math.round(session.durationSeconds / 60)}:
              {String(session.durationSeconds % 60).padStart(2, "0")}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onPlay}
                className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface)]"
              >
                Play audio (TTS)
              </button>
              <button
                type="button"
                onClick={() => setShowTranscript((v) => !v)}
                className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface)]"
              >
                {showTranscript ? "Hide transcript" : "Show transcript"}
              </button>
            </div>
            {showTranscript && session.transcript ? (
              <pre className="whitespace-pre-wrap rounded-lg bg-[var(--surface)] p-3 text-sm text-[var(--foreground)]">
                {session.transcript}
              </pre>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            {error}
          </p>
        ) : null}
      </section>

      {questions.length > 0 ? (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Comprehension
          </h3>
          <ul className="mt-4 space-y-4">
            {questions.map((q, qi) => (
              <li key={q.id}>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {qi + 1}. {q.prompt}
                </p>
                <div className="mt-2 space-y-1">
                  {q.options.map((option, oi) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[qi] === oi}
                        onChange={() =>
                          setAnswers((prev) => {
                            const next = [...prev];
                            next[qi] = oi;
                            return next;
                          })
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            data-testid="submit-listening"
            disabled={pending || Boolean(result)}
            onClick={onSubmit}
            className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Submit answers
          </button>
          {result ? (
            <p className="mt-3 text-sm text-[var(--foreground)]">
              Score: {Math.round(result.score)}% ({result.correct}/{result.total})
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Recent listening
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          {history.length === 0 ? (
            <li className="text-[var(--muted-foreground)]">No sessions yet.</li>
          ) : (
            history.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              >
                {item.title}
                {item.score != null ? ` · ${Math.round(item.score)}%` : ""}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
