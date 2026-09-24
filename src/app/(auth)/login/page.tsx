import { LoginForm } from "@/components/auth/LoginForm";
import { AppStatusBar } from "@/components/layout/AppStatusBar";
import { APP_VERSION, APP_VERSION_EMOJI } from "@/lib/appVersion";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 pt-14">
      <AppStatusBar variant="public" />
      <meta name="englishtutor-version" content={APP_VERSION} />
      <p className="sr-only" data-englishtutor-version={APP_VERSION}>
        {APP_VERSION}
      </p>
      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
          AI English Tutor
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Giriş yap
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Kendi hesabınla ders takibini sürdür.
        </p>
        <p
          className="mt-3 text-xs font-semibold tracking-wider text-[var(--foreground)]"
          data-englishtutor-version={APP_VERSION}
        >
          {APP_VERSION_EMOJI} {APP_VERSION}
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
