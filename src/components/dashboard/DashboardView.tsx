import type { DashboardData } from "@/types/learning";
import { formatPercent } from "@/utils/cn";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function AreaList({
  title,
  items,
  tone,
}: {
  title: string;
  items: DashboardData["weakAreas"];
  tone: "weak" | "strong";
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--muted-foreground)]">{item.name}</span>
            <span
              className={
                tone === "weak"
                  ? "text-sm font-medium text-amber-700 dark:text-amber-300"
                  : "text-sm font-medium text-teal-700 dark:text-teal-300"
              }
            >
              {formatPercent(item.score)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DashboardView({ data }: { data: DashboardData }) {
  const { stats, skills, weakAreas, strongAreas, recommendation } = data;

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="English Level" value={stats.overallLevel} />
        <StatCard label="Today's Goal" value={`${stats.dailyGoalMinutes} minutes`} />
        <StatCard label="Current Streak" value={`${stats.currentStreak} days`} />
        <StatCard label="Words Learned" value={String(stats.wordsLearned)} />
        <StatCard label="Conversations" value={String(stats.conversations)} />
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Skill breakdown
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {skills.map((skill) => (
            <div
              key={skill.skill}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
            >
              <p className="text-xs capitalize text-[var(--muted)]">{skill.skill}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                {skill.level}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <AreaList title="Weak Areas" items={weakAreas} tone="weak" />
        <AreaList title="Strong Areas" items={strongAreas} tone="strong" />
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Today&apos;s Recommendation
        </h2>
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          {recommendation.headline}
        </p>
        <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
          Today&apos;s lesson will focus on:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted-foreground)]">
          {recommendation.focusTopics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Estimated time: {recommendation.estimatedMinutes} minutes
        </p>
      </section>
    </div>
  );
}
