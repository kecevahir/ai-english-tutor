"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  listSpeakingAction,
  startSpeakingAction,
  submitSpeakingAction,
} from "@/app/(app)/speaking/actions";
import {
  createWebSpeechToTextProvider,
  createWebTextToSpeechProvider,
} from "@/services/speech/webSpeech";

export function SpeakingWorkspace() {
  const [topic, setTopic] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<{
    grammarNotes: string | null;
    fluencyNotes: string | null;
    vocabularyNotes: string | null;
    pronunciationNotes: string | null;
    focusArea: string | null;
  } | null>(null);
  const [history, setHistory] = useState<
    Awaited<ReturnType<typeof listSpeakingAction>>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef<number | null>(null);
  const sttRef = useRef(createWebSpeechToTextProvider());
  const ttsRef = useRef(createWebTextToSpeechProvider());

  useEffect(() => {
    setSttSupported(sttRef.current.isSupported());
    setTtsSupported(ttsRef.current.isSupported());
    startTransition(async () => setHistory(await listSpeakingAction()));
  }, []);

  function onStart() {
    setError(null);
    setFeedback(null);
    setTranscript("");
    startTransition(async () => {
      const result = await startSpeakingAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSessionId(result.session.id);
      setTopic(result.session.topic);
      startedAt.current = Date.now();
      if (ttsSupported && result.session.topic) {
        try {
          await ttsRef.current.speak(result.session.topic);
        } catch {
          // TTS optional
        }
      }
    });
  }

  async function onMic() {
    setError(null);
    const stt = sttRef.current;
    if (!stt.isSupported()) {
      setError(
        "Speech-to-text is unavailable in this browser. Type your answer below instead.",
      );
      return;
    }
    try {
      setListening(true);
      stt.onResult((result) => {
        if (result.isFinal || result.transcript) {
          setTranscript(result.transcript);
        }
      });
      stt.onError((err) => {
        setError(err.message);
        setListening(false);
      });
      await stt.start({ lang: "en-US" });
    } catch (err) {
      setListening(false);
      setError(err instanceof Error ? err.message : "Microphone failed.");
    }
  }

  async function onStopMic() {
    await sttRef.current.stop();
    setListening(false);
  }

  function onSubmit() {
    if (!sessionId) return;
    setError(null);
    const durationSeconds = startedAt.current
      ? Math.max(1, Math.round((Date.now() - startedAt.current) / 1000))
      : 60;
    startTransition(async () => {
      await onStopMic();
      const result = await submitSpeakingAction({
        sessionId,
        transcript,
        durationSeconds,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFeedback(result.session);
      setHistory(await listSpeakingAction());
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Speaking session
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              STT: {sttSupported ? "supported" : "unavailable"} · TTS:{" "}
              {ttsSupported ? "supported" : "unavailable"}
            </p>
          </div>
          <button
            type="button"
            data-testid="start-speaking"
            onClick={onStart}
            disabled={pending}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            New prompt
          </button>
        </div>

        {topic ? (
          <p className="mt-4 text-lg font-medium text-[var(--foreground)]">
            {topic}
          </p>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Start a prompt, speak or type your answer, then get descriptive feedback.
          </p>
        )}

        {topic ? (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={listening ? onStopMic : onMic}
                className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface)]"
              >
                {listening ? "Stop mic" : "Record answer"}
              </button>
              <button
                type="button"
                data-testid="submit-speaking"
                disabled={pending || !transcript.trim()}
                onClick={onSubmit}
                className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Analyze
              </button>
            </div>
            <textarea
              data-testid="speaking-transcript"
              className="min-h-28 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your spoken transcript appears here (or type)…"
            />
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            {error}
          </p>
        ) : null}
      </section>

      {feedback ? (
        <section
          data-testid="speaking-feedback"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
        >
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Performance feedback
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-medium">Grammar</dt>
              <dd className="text-[var(--muted-foreground)]">
                {feedback.grammarNotes}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Fluency</dt>
              <dd className="text-[var(--muted-foreground)]">
                {feedback.fluencyNotes}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Vocabulary</dt>
              <dd className="text-[var(--muted-foreground)]">
                {feedback.vocabularyNotes}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Pronunciation / Naturalness</dt>
              <dd className="text-[var(--muted-foreground)]">
                {feedback.pronunciationNotes}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Focus Area</dt>
              <dd className="text-[var(--muted-foreground)]">
                {feedback.focusArea}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Recent sessions
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
                <p className="font-medium text-[var(--foreground)]">
                  {item.topic}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {item.focusArea ?? "In progress"}
                  {item.completedAt
                    ? ` · ${new Date(item.completedAt).toLocaleString()}`
                    : ""}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
