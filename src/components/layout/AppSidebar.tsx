"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  MessagesSquare,
  Mic,
  Headphones,
  Library,
  SpellCheck2,
  RotateCcw,
  LineChart,
  Settings,
  ClipboardCheck,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { LogoutButton } from "@/components/auth/LogoutButton";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lesson", label: "Today's Lesson", icon: BookOpen },
  { href: "/conversation", label: "AI Conversation", icon: MessagesSquare },
  { href: "/speaking", label: "Speaking", icon: Mic },
  { href: "/listening", label: "Listening", icon: Headphones },
  { href: "/vocabulary", label: "Vocabulary", icon: Library },
  { href: "/grammar", label: "Grammar", icon: SpellCheck2 },
  { href: "/review", label: "Review", icon: RotateCcw },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/assessment", label: "Seviye ölçümü", icon: ClipboardCheck },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
              AI English
            </p>
            <p className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
              Tutor
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 pb-6">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--border)] px-3 py-3">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
