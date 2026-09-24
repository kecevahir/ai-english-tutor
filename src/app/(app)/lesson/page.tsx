import { AppHeader } from "@/components/layout/AppHeader";
import { requireDemoUser } from "@/lib/database/repositories/userRepository";
import { getTodaysLesson } from "@/lib/database/repositories/learningRepository";

export const dynamic = "force-dynamic";

export default async function LessonPage() {
  const user = await requireDemoUser();
  const lesson = await getTodaysLesson(user.id);

  return (
    <div>
      <AppHeader
        title="Today's Lesson"
        subtitle="Adaptive plan from your learning profile"
      />
      {lesson ? (
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
            <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
              {lesson.status}
            </span>
          </div>
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
              </li>
            ))}
          </ol>
          <p className="text-xs text-[var(--muted)]">
            Interactive activities arrive in Phase 6. This view reads today&apos;s
            seeded plan from the database.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-sm text-[var(--muted-foreground)]">
          No lesson planned for today. Run the adaptive lesson generator (Phase 6)
          or re-seed the database.
        </div>
      )}
    </div>
  );
}
