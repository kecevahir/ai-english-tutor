import { AppHeader } from "@/components/layout/AppHeader";
import { SpeakingWorkspace } from "@/components/speaking/SpeakingWorkspace";

export default function SpeakingPage() {
  return (
    <div>
      <AppHeader
        title="Speaking"
        subtitle="Prompt → speak/type → descriptive feedback (no single score)"
      />
      <SpeakingWorkspace />
    </div>
  );
}
