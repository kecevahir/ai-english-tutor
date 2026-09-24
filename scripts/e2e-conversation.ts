import {
  endConversation,
  sendConversationMessage,
  startConversation,
} from "../src/services/conversation/conversationService";

async function main() {
  const started = await startConversation({
    mode: "FREE",
    difficulty: "ADAPTIVE",
  });
  console.log("started", started.id, "msgs", started.messages.length);

  const afterSend = await sendConversationMessage({
    conversationId: started.id,
    content: "Yesterday I go to my office and I meet my customer.",
  });
  console.log("afterSend msgs", afterSend.messages.length);
  console.log("assistant:", afterSend.messages.at(-1)?.content.slice(0, 120));

  const ended = await endConversation(started.id);
  console.log("ended mistakes", ended.mistakes.length);
  for (const m of ended.mistakes) {
    console.log(
      "-",
      m.category,
      m.subCategory,
      "=>",
      m.correctedSentence.slice(0, 80),
    );
  }
  if (ended.mistakes.length < 1) {
    process.exit(2);
  }
  console.log("SERVICE_E2E_OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
