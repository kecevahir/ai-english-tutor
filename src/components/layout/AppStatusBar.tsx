"use client";

import { useEffect, useState } from "react";

export const APP_VERSION = "V1.1";

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

export function AppStatusBar() {
  const [now, setNow] = useState(() => formatNow(new Date()));

  useEffect(() => {
    const tick = () => setNow(formatNow(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 pt-10 text-xs text-[var(--muted)] lg:pt-0">
      <time dateTime={new Date().toISOString()} className="font-medium tabular-nums tracking-wide">
        {now}
      </time>
      <span className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-semibold tracking-wider text-[var(--foreground)]">
        {APP_VERSION}
      </span>
    </div>
  );
}
