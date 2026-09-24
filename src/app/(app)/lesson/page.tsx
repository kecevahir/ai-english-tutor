import { AppHeader } from "@/components/layout/AppHeader";
import { LessonWorkspace } from "@/components/lesson/LessonWorkspace";

export default function LessonPage() {
  return (
    <div>
      <AppHeader
        title="Today's Lesson"
        subtitle="Generated from weak areas, due vocabulary, and recent mistakes"
      />
      <LessonWorkspace />
    </div>
  );
}
