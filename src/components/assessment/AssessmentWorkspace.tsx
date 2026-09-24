"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import {
  fetchAssessmentQuestionsAction,
  submitAssessmentAction,
} from "@/app/(app)/assessment/actions";
import type { AssessmentQuestion } from "@/services/assessment/assessmentService";
import {
  createWebSpeechToTextProvider,
  createWebTextToSpeechProvider,
} from "@/services/speech/webSpeech";
import {
  LevelDefinitionCard,
  LevelDefinitionsPanel,
} from "@/components/assessment/LevelDefinitions";

const SECTION_ORDER = ["reading", "writing", "listening", "speaking"] as const;
const SECTION_LABEL: Record<(typeof SECTION_ORDER)[number], string> = {
  reading: "Reading",
  writing: "Writing",
  listening: "Listening",
  speaking: "Speaking",
};

export function AssessmentWorkspace() {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof submitAssessmentAction>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sttRef = useRef<ReturnType<typeof createWebSpeechToTextProvider> | null>(
    null,
  );
  const ttsRef = useRef<ReturnType<typeof createWebTextToSpeechProvider> | null>(
    null,
  );

  useEffect(() => {
    sttRef.current = createWebSpeechToTextProvider();
    ttsRef.current = createWebTextToSpeechProvider();
    startTransition(async () => {
      setQuestions(await fetchAssessmentQuestionsAction());
    });
    return () => {
      void sttRef.current?.stop();
      void ttsRef.current?.stop();
    };
  }, []);

  async function playListening(question: AssessmentQuestion) {
    setSpeechError(null);
    const text = question.audioText;
    if (!text) return;
    try {
      if (!ttsRef.current?.isSupported()) {
        setSpeechError(
          "Tarayıcınız sesli dinlemeyi desteklemiyor. Chrome veya Edge kullanın.",
        );
        return;
      }
      await ttsRef.current.speak(text, { lang: "en-US", rate: 0.95 });
    } catch (err) {
      setSpeechError(
        err instanceof Error ? err.message : "Ses çalınamadı.",
      );
    }
  }

  async function toggleSpeaking(questionId: string) {
    setSpeechError(null);
    const stt = sttRef.current;
    if (!stt) return;

    if (recordingId === questionId) {
      await stt.stop();
      setRecordingId(null);
      return;
    }

    if (!stt.isSupported()) {
      setSpeechError(
        "Konuşma tanıma bu tarayıcıda yok. Chrome/Edge kullanın veya cevabı yazın.",
      );
      return;
    }

    try {
      await stt.stop();
      stt.onResult((result) => {
        setAnswers((prev) => {
          const finalKey = `${questionId}__final`;
          const base = String(prev[finalKey] ?? "");
          if (result.isFinal) {
            const next = `${base} ${result.transcript}`.trim();
            return { ...prev, [questionId]: next, [finalKey]: next };
          }
          return {
            ...prev,
            [questionId]: `${base} ${result.transcript}`.trim(),
          };
        });
      });
      stt.onError((err) => {
        setSpeechError(err.message);
        setRecordingId(null);
      });
      await stt.start({
        lang: "en-US",
        continuous: true,
        interimResults: true,
      });
      setRecordingId(questionId);
    } catch (err) {
      setSpeechError(
        err instanceof Error
          ? err.message
          : "Mikrofon başlatılamadı. İzin verdiğinizden emin olun.",
      );
      setRecordingId(null);
    }
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      if (recordingId) {
        await sttRef.current?.stop();
        setRecordingId(null);
      }
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
          Senin seviyen: {result.result.overallLevel}
        </h2>
        <LevelDefinitionCard code={result.result.overallLevel} />
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {result.result.skills.map((skill) => (
            <li
              key={skill.skill}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            >
              {skill.skill}: {skill.level} ({skill.score}%)
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          Sonuç kaydedildi. Bundan sonraki dersler bu seviyeye göre
          kişiselleştirilecek.
        </p>
        <Link
          href="/lesson"
          className="mt-6 inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Bugünkü derse git
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <p className="max-w-2xl text-sm text-[var(--muted-foreground)]">
        Kısa yerleşim testi: Reading, Writing, Listening ve Speaking.
        Listening için sesi dinle; Speaking için mikrofona konuş (Chrome/Edge
        önerilir). Sonuçların ders içeriğini belirler.
      </p>

      <LevelDefinitionsPanel />

      {SECTION_ORDER.map((section) => {
        const sectionQuestions = questions.filter((q) => q.section === section);
        if (sectionQuestions.length === 0) return null;
        return (
          <div key={section} className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
              {SECTION_LABEL[section]}
            </h2>
            {sectionQuestions.map((q) => (
              <section
                key={q.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
              >
                {q.passage ? (
                  <p className="rounded-md bg-[var(--surface)] px-3 py-2 text-sm leading-relaxed text-[var(--foreground)]">
                    {q.passage}
                  </p>
                ) : null}

                <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
                  {q.prompt}
                </p>

                {q.section === "listening" && q.audioText ? (
                  <button
                    type="button"
                    onClick={() => void playListening(q)}
                    className="mt-3 inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)]"
                  >
                    <Volume2 className="h-4 w-4" />
                    Dinle
                  </button>
                ) : null}

                {q.input === "choice" && q.options ? (
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
                ) : null}

                {q.input === "text" || q.input === "speech" ? (
                  <div className="mt-3 space-y-2">
                    {q.input === "speech" ? (
                      <button
                        type="button"
                        onClick={() => void toggleSpeaking(q.id)}
                        className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)]"
                      >
                        {recordingId === q.id ? (
                          <>
                            <Square className="h-4 w-4 text-red-500" />
                            Kaydı bitir
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4" />
                            Mikrofona konuş
                          </>
                        )}
                      </button>
                    ) : null}
                    <textarea
                      className="min-h-24 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      placeholder={
                        q.input === "speech"
                          ? "Konuşma metne dökülür; istersen düzenleyebilirsin."
                          : "Cevabını yaz…"
                      }
                      value={String(answers[q.id] ?? "")}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        );
      })}

      {speechError ? (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
          {speechError}
        </p>
      ) : null}
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
        className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Testi bitir ve seviyemi kaydet"}
      </button>
    </div>
  );
}
