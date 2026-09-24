import { AppHeader } from "@/components/layout/AppHeader";
import { requireCurrentUser } from "@/lib/database/repositories/userRepository";
import { prisma } from "@/lib/database/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requireCurrentUser();
  const mistakes = await prisma.mistake.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      grammarTopic: true,
      conversation: { select: { id: true, title: true } },
    },
  });

  const dueWords = await prisma.vocabularyProgress.findMany({
    where: {
      userId: user.id,
      OR: [{ nextReview: null }, { nextReview: { lte: new Date() } }],
    },
    include: { vocabulary: true },
    take: 20,
    orderBy: { nextReview: "asc" },
  });

  return (
    <div>
      <AppHeader
        title="Review"
        subtitle="Recent conversation corrections and words due for practice"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Recent Mistakes
          </h2>
          {mistakes.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              No mistakes yet. End an AI Conversation to generate a review.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {mistakes.map((m) => (
                <li
                  key={m.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
                >
                  <p className="text-xs text-[var(--muted)]">
                    {m.category}
                    {m.subCategory ? ` · ${m.subCategory}` : ""}
                  </p>
                  <p className="mt-1 text-[var(--muted-foreground)] line-through opacity-80">
                    {m.originalSentence}
                  </p>
                  <p className="mt-1 text-[var(--foreground)]">
                    {m.correctedSentence}
                  </p>
                  {m.conversation ? (
                    <Link
                      href="/conversation"
                      className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline"
                    >
                      From: {m.conversation.title ?? "Conversation"}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Words Due Today
          </h2>
          {dueWords.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              No vocabulary due. Conversation extraction will fill this list.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {dueWords.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                >
                  <span className="font-medium text-[var(--foreground)]">
                    {item.vocabulary.word}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {item.vocabulary.translation ?? item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
