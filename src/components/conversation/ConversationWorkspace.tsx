"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type {
  Conversation,
  ConversationDifficulty,
  ConversationMessage,
  ConversationMode,
  GrammarTopic,
  Mistake,
} from "@prisma/client";
import {
  endConversationAction,
  fetchConversationAction,
  fetchConversationsAction,
  sendMessageAction,
  startConversationAction,
} from "@/app/(app)/conversation/actions";
import {
  CONVERSATION_DIFFICULTIES,
  CONVERSATION_MODES,
  difficultyLabel,
  modeLabel,
} from "@/services/conversation/constants";
import { cn } from "@/utils/cn";

type ConversationListItem = Conversation & {
  _count: { messages: number; mistakes: number };
};

type ConversationDetail = Conversation & {
  messages: ConversationMessage[];
  mistakes: Array<Mistake & { grammarTopic: GrammarTopic | null }>;
};

export function ConversationWorkspace() {
  const [provider, setProvider] = useState("mock");
  const [list, setList] = useState<ConversationListItem[]>([]);
  const [active, setActive] = useState<ConversationDetail | null>(null);
  const [mode, setMode] = useState<ConversationMode>("FREE");
  const [difficulty, setDifficulty] =
    useState<ConversationDifficulty>("ADAPTIVE");
  const [customPrompt, setCustomPrompt] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const showCustom = mode === "CUSTOM";
  const ended = Boolean(active?.endedAt);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchConversationsAction();
        if (cancelled) return;
        setList(data.conversations);
        setProvider(data.provider);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load.");
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  const title = useMemo(() => {
    if (!active) return "AI Conversation";
    return active.title ?? modeLabel(active.mode);
  }, [active]);

  function refreshList() {
    startTransition(async () => {
      const data = await fetchConversationsAction();
      setList(data.conversations);
      setProvider(data.provider);
    });
  }

  function openConversation(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        const conversation = await fetchConversationAction(id);
        setActive(conversation);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to open chat.");
      }
    });
  }

  function onStart() {
    setError(null);
    startTransition(async () => {
      try {
        const conversation = await startConversationAction({
          mode,
          difficulty,
          customPrompt: showCustom ? customPrompt : undefined,
        });
        setActive(conversation);
        refreshList();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start.");
      }
    });
  }

  function onSend() {
    if (!active || !draft.trim() || ended) return;
    const content = draft;
    setDraft("");
    setError(null);
    startTransition(async () => {
      const result = await sendMessageAction({
        conversationId: active.id,
        content,
      });
      if (!result.ok) {
        setError(result.error);
        setDraft(content);
        return;
      }
      setActive(result.conversation);
      refreshList();
    });
  }

  function onEnd() {
    if (!active) return;
    setError(null);
    startTransition(async () => {
      const result = await endConversationAction(active.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setActive(result.conversation);
      refreshList();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          History
        </p>
        {loadingList ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">Loading…</p>
        ) : list.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No conversations yet.
          </p>
        ) : (
          <ul className="mt-3 max-h-[28rem] space-y-1 overflow-y-auto">
            {list.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openConversation(item.id)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    active?.id === item.id
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "hover:bg-[var(--surface)] text-[var(--foreground)]",
                  )}
                >
                  <span className="block font-medium truncate">
                    {item.title ?? modeLabel(item.mode)}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">
                    {item._count.messages} msgs
                    {item.endedAt ? ` · ${item._count.mistakes} mistakes` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                {title}
              </h2>
              <p className="text-xs text-[var(--muted)]">
                AI provider: <code>{provider}</code>
                {provider === "mock"
                  ? " · local mock (set OPENAI_API_KEY / ANTHROPIC_API_KEY for real AI)"
                  : null}
              </p>
            </div>
            {active && !ended ? (
              <button
                type="button"
                onClick={onEnd}
                disabled={pending}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface)] disabled:opacity-60"
              >
                End & Review
              </button>
            ) : null}
          </div>

          {!active ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-[var(--muted)]">Mode</span>
                <select
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as ConversationMode)}
                >
                  {CONVERSATION_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-[var(--muted)]">Difficulty</span>
                <select
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as ConversationDifficulty)
                  }
                >
                  {CONVERSATION_DIFFICULTIES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              {showCustom ? (
                <label className="sm:col-span-2 text-sm">
                  <span className="mb-1 block text-[var(--muted)]">
                    Custom scenario
                  </span>
                  <textarea
                    className="min-h-20 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe the scenario…"
                  />
                </label>
              ) : null}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={onStart}
                  disabled={pending}
                  className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "Starting…" : "Start conversation"}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              {modeLabel(active.mode)} · {difficultyLabel(active.difficulty)}
              {ended ? " · Ended" : " · In progress"}
            </p>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            {error}
          </div>
        ) : null}

        {active ? (
          <>
            <div className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              {active.messages
                .filter((m) => m.role !== "SYSTEM")
                .map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                      message.role === "USER"
                        ? "ml-auto bg-[var(--accent)] text-white"
                        : "bg-[var(--surface)] text-[var(--foreground)]",
                    )}
                  >
                    {message.content}
                  </div>
                ))}
              {pending ? (
                <p className="text-xs text-[var(--muted)]">Thinking…</p>
              ) : null}
              <div ref={bottomRef} />
            </div>

            {!ended ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSend();
                }}
              >
                <input
                  className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type in English…"
                  disabled={pending}
                />
                <button
                  type="submit"
                  disabled={pending || !draft.trim()}
                  className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  Send
                </button>
              </form>
            ) : (
              <ConversationReview mistakes={active.mistakes} />
            )}

            <button
              type="button"
              className="text-sm text-[var(--accent)] hover:underline"
              onClick={() => setActive(null)}
            >
              Start another conversation
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ConversationReview({
  mistakes,
}: {
  mistakes: Array<Mistake & { grammarTopic: GrammarTopic | null }>;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">
        Conversation Review
      </h3>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Mistakes were captured in the background and saved after the chat ended.
      </p>
      {mistakes.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          No corrections recorded for this conversation.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {mistakes.map((mistake) => (
            <li
              key={mistake.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                {mistake.category}
                {mistake.subCategory ? ` · ${mistake.subCategory}` : ""}
                {mistake.grammarTopic ? ` · ${mistake.grammarTopic.name}` : ""}
              </p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--foreground)]">
                  Original:
                </span>{" "}
                {mistake.originalSentence}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--foreground)]">
                  Corrected:
                </span>{" "}
                {mistake.correctedSentence}
              </p>
              {mistake.explanation ? (
                <p className="mt-2 text-sm text-[var(--foreground)]">
                  {mistake.explanation}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
