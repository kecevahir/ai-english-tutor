import { LEVEL_DEFINITIONS, getLevelDefinition } from "@/lib/learning/levelDefinitions";

export function LevelDefinitionsPanel({
  highlightCode,
}: {
  highlightCode?: string;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Seviye tanımları (CEFR)
        </h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Test sonucu bu skalaya yerleştirilir; dersler buna göre seçilir.
        </p>
      </div>
      <ul className="space-y-2">
        {LEVEL_DEFINITIONS.map((level) => {
          const active =
            highlightCode &&
            level.code.toUpperCase() === highlightCode.toUpperCase();
          return (
            <li
              key={level.code}
              className={
                active
                  ? "rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2.5"
                  : "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
              }
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {level.code}{" "}
                <span className="font-medium text-[var(--muted)]">
                  · {level.title}
                </span>
                {active ? (
                  <span className="ml-2 text-xs font-medium text-[var(--accent)]">
                    Senin seviyen
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                {level.summary}
              </p>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-[var(--muted)]">
                {level.canDo.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function LevelDefinitionCard({ code }: { code: string }) {
  const level = getLevelDefinition(code);
  if (!level) return null;
  return (
    <div className="mt-4 rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3">
      <p className="text-sm font-semibold text-[var(--foreground)]">
        {level.code} · {level.title}
      </p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{level.summary}</p>
      <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-[var(--muted)]">
        {level.canDo.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
