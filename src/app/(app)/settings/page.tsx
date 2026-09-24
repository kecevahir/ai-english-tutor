import { AppHeader } from "@/components/layout/AppHeader";
import { EnglishOnlyToggle } from "@/components/settings/EnglishOnlyToggle";
import { requireDemoUser } from "@/lib/database/repositories/userRepository";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireDemoUser();
  const profile = user.profile!;

  return (
    <div>
      <AppHeader
        title="Settings"
        subtitle="Preferences for the password-free MVP profile"
      />
      <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            English Only Mode
          </h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--muted-foreground)]">
            ON: tutor communicates in English. OFF: Turkish explanations are
            allowed when teaching.
          </p>
          <div className="mt-4">
            <EnglishOnlyToggle enabled={profile.englishOnlyMode} />
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Study goal
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Daily goal: <strong>{profile.dailyGoalMinutes} minutes</strong>
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Editable goal controls arrive with daily lesson scheduling.
          </p>
        </div>

        <div className="border-t border-[var(--border)] pt-6">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Appearance
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Use the Light / Dark toggle in the header. Preference is stored in
            the browser for Phase 1; profile theme field is ready for sync later.
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Profile theme: {profile.theme}
          </p>
        </div>
      </div>
    </div>
  );
}
