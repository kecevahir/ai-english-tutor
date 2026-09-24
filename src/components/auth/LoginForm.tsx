"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/app/(auth)/actions";

const initial: AuthFormState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--foreground)]">Kullanıcı adı</span>
        <input
          name="username"
          autoComplete="username"
          required
          minLength={3}
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--foreground)]">Şifre</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Hesabın yok mu?{" "}
        <Link href="/register" className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
          Kayıt ol
        </Link>
      </p>
    </form>
  );
}
