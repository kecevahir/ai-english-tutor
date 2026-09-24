import { AppHeader } from "@/components/layout/AppHeader";
import { ConversationWorkspace } from "@/components/conversation/ConversationWorkspace";

export default function ConversationPage() {
  return (
    <div>
      <AppHeader
        title="AI Conversation"
        subtitle="Practice in English — corrections are saved when you end the chat"
      />
      <ConversationWorkspace />
    </div>
  );
}
