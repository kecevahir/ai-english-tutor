import { AppHeader } from "@/components/layout/AppHeader";
import { ProgressWorkspace } from "@/components/progress/ProgressWorkspace";

export default function ProgressPage() {
  return (
    <div>
      <AppHeader
        title="Progress"
        subtitle="Skills, mistakes, study volume, and weekly AI report"
      />
      <ProgressWorkspace />
    </div>
  );
}
