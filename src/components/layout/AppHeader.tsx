"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="pt-12 lg:pt-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{subtitle}</p>
        ) : null}
      </div>
      <ThemeToggle />
    </header>
  );
}
