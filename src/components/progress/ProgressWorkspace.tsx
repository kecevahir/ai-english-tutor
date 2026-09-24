"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchProgressAction } from "@/app/(app)/progress/actions";
import type { ProgressRange } from "@/services/progress/progressService";
import { cn, formatPercent } from "@/utils/cn";

const RANGES: Array<{ value: ProgressRange; label: string }> = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "3 Months" },
  { value: "all", label: "All Time" },
];

export function ProgressWorkspace() {
  const [range, setRange] = useState<ProgressRange>("30d");
  const [data, setData] = useState<Awaited<
    ReturnType<typeof fetchProgressAction>
  > | null>(null);
  const [pending, startTransition] = useTransition();

  function load(next: ProgressRange) {
    startTransition(async () => {
      setData(await fetchProgressAction(next));
    });
  }

  useEffect(() => {
    load("30d");
  }, []);

  if (!data) {
    return <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>;
  }

  const { overview, weekly } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {RANGES.map((item) => (
          <button
            key={item.value}
            type="button"
            disabled={pending}
            onClick={() => {
              setRange(item.value);
              load(item.value);
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              range === item.value
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "bg-[var(--surface)] text-[var(--muted-foreground)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {overview.skills.map((skill) => (
          <div
            key={skill.skill}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <p className="text-xs capitalize text-[var(--muted)]">{skill.skill}</p>
            <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              {skill.level}
            </p>
            <p className="text-xs text-[var(--muted)]">
              score {Math.round(skill.score)}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold">Most Improved Areas</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {overview.mostImproved.map((a) => (
              <li key={a.name} className="flex justify-between">
                <span>{a.name}</span>
                <span>{formatPercent(a.score)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold">Areas Needing Attention</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {overview.needsAttention.map((a) => (
              <li key={a.name} className="flex justify-between">
                <span>{a.name}</span>
                <span>{formatPercent(a.score)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Words Learned" value={String(overview.stats.wordsLearned)} />
        <Stat
          label="Speaking Minutes"
          value={String(overview.stats.speakingMinutes)}
        />
        <Stat
          label="Lessons Completed"
          value={String(overview.stats.lessonsCompleted)}
        />
        <Stat label="Conversations" value={String(overview.stats.conversations)} />
        <Stat
          label="Review Accuracy"
          value={`${overview.stats.reviewAccuracy}%`}
        />
        <Stat
          label="Listening Sessions"
          value={String(overview.stats.listeningSessions)}
        />
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold">Recent Mistakes</h2>
        <ul className="mt-3 space-y-3">
          {overview.recentMistakes.length === 0 ? (
            <li className="text-sm text-[var(--muted-foreground)]">
              No mistakes in this range.
            </li>
          ) : (
            overview.recentMistakes.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
              >
                <p className="text-xs text-[var(--muted)]">{m.category}</p>
                <p className="text-[var(--muted-foreground)] line-through">
                  {m.original}
                </p>
                <p>{m.corrected}</p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold">{weekly.title}</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {weekly.studyHint}
        </p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Vocabulary: {weekly.vocabulary}
        </p>
        <p className="mt-3 text-sm">
          <span className="font-medium">Main Improvement:</span>{" "}
          {weekly.mainImprovement}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-medium">Needs Attention:</span>{" "}
          {weekly.needsAttention.join(", ")}
        </p>
        {weekly.repeatedMistake ? (
          <div className="mt-3 text-sm">
            <p className="font-medium">Repeated Mistake</p>
            <p className="text-[var(--muted-foreground)]">
              {weekly.repeatedMistake.wrong}
            </p>
            <p>Correct: {weekly.repeatedMistake.correct}</p>
          </div>
        ) : null}
        <p className="mt-3 text-sm">
          <span className="font-medium">Next Week Focus:</span>{" "}
          {weekly.nextWeekFocus.join(" · ")}
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
