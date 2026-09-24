import { AppHeader } from "@/components/layout/AppHeader";
import { AssessmentWorkspace } from "@/components/assessment/AssessmentWorkspace";

export default function AssessmentPage() {
  return (
    <div>
      <AppHeader
        title="Level Assessment"
        subtitle="Vocabulary, grammar, reading, writing, and speaking placement"
      />
      <AssessmentWorkspace />
    </div>
  );
}
