import { AppHeader } from "@/components/layout/AppHeader";
import { GrammarWorkspace } from "@/components/grammar/GrammarWorkspace";

export default function GrammarPage() {
  return (
    <div>
      <AppHeader
        title="Grammar"
        subtitle="Topic mastery tracking and weak-area drills"
      />
      <GrammarWorkspace />
    </div>
  );
}
