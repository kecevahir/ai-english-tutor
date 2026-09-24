"use client";

import { useTransition } from "react";
import { setEnglishOnlyMode } from "@/app/(app)/settings/actions";

export function EnglishOnlyToggle({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setEnglishOnlyMode(!enabled);
        });
      }}
      className="inline-flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"
      aria-pressed={enabled}
    >
      <span
        className={
          enabled
            ? "inline-flex h-6 w-11 items-center rounded-full bg-teal-600 px-1"
            : "inline-flex h-6 w-11 items-center rounded-full bg-zinc-400 px-1"
        }
      >
        <span
          className={
            enabled
              ? "ml-auto h-4 w-4 rounded-full bg-white"
              : "h-4 w-4 rounded-full bg-white"
          }
        />
      </span>
      <span className="font-medium text-[var(--foreground)]">
        English Only Mode: {enabled ? "ON" : "OFF"}
      </span>
    </button>
  );
}
