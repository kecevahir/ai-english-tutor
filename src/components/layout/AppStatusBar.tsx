"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

/** Bump this on each release so the login page shows deploy status. */
export const APP_VERSION = "V1.2";

function formatNow(d: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

export function AppStatusBar({ variant = "app" }: { variant?: "app" | "public" }) {
  const [now, setNow] = useState(() => formatNow(new Date()));

  useEffect(() => {
    const tick = () => setNow(formatNow(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]",
        variant === "app" &&
          "mb-4 border-b border-[var(--border)] pb-3 pt-10 lg:pt-0",
        variant === "public" &&
          "fixed left-0 right-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 py-2.5 backdrop-blur",
      )}
    >
      <time className="font-medium tabular-nums tracking-wide" suppressHydrationWarning>
        {now}
      </time>
      <span className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-semibold tracking-wider text-[var(--foreground)]">
        {APP_VERSION}
      </span>
    </div>
  );
}
