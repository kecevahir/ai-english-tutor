import { AppHeader } from "@/components/layout/AppHeader";
import { ListeningWorkspace } from "@/components/listening/ListeningWorkspace";

export default function ListeningPage() {
  return (
    <div>
      <AppHeader
        title="Listening"
        subtitle="Level-matched dialogue, comprehension, transcript, vocabulary capture"
      />
      <ListeningWorkspace />
    </div>
  );
}
