import { AppHeader } from "@/components/layout/AppHeader";
import { AssessmentWorkspace } from "@/components/assessment/AssessmentWorkspace";

export default function AssessmentPage() {
  return (
    <div>
      <AppHeader
        title="Seviye ölçümü"
        subtitle="Reading · Writing · Listening · Speaking — sonuçların dersleri kişiselleştirir"
      />
      <AssessmentWorkspace />
    </div>
  );
}
