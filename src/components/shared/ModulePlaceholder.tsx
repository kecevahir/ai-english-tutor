import { AppHeader } from "@/components/layout/AppHeader";

export function ModulePlaceholder({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div>
      <AppHeader title={title} subtitle={`${phase} · scaffold ready`} />
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8">
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
        <p className="mt-4 text-xs uppercase tracking-wide text-[var(--muted)]">
          Not implemented yet — Phase 1 foundation only
        </p>
      </div>
    </div>
  );
}
