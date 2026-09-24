import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppStatusBar } from "@/components/layout/AppStatusBar";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <AppSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <AppStatusBar />
          {children}
        </div>
      </main>
    </div>
  );
}
