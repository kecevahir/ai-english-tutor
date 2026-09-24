"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Çıkış yap
      </button>
    </form>
  );
}
