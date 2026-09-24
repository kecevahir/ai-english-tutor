import { AppHeader } from "@/components/layout/AppHeader";
import { VocabularyWorkspace } from "@/components/vocabulary/VocabularyWorkspace";

export default function VocabularyPage() {
  return (
    <div>
      <AppHeader
        title="Vocabulary"
        subtitle="Word bank, spaced repetition, and mixed exercise types"
      />
      <VocabularyWorkspace />
    </div>
  );
}
