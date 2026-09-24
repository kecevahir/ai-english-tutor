"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthFormState } from "@/app/(auth)/actions";

const initial: AuthFormState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <form action={action} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--foreground)]">Görünen ad</span>
        <input
          name="displayName"
          autoComplete="name"
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--foreground)]">Kullanıcı adı</span>
        <input
          name="username"
          autoComplete="username"
          required
          minLength={3}
          pattern="[a-zA-Z0-9_]+"
          title="Harf, rakam ve alt çizgi"
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--foreground)]">Şifre</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
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
        {pending ? "Hesap oluşturuluyor…" : "Kayıt ol"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Zaten hesabın var mı?{" "}
        <Link href="/login" className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
          Giriş yap
        </Link>
      </p>
    </form>
  );
}
