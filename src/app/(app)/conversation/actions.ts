"use server";

import {
  ConversationDifficulty,
  ConversationMode,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  endConversation,
  getConversation,
  listConversations,
  sendConversationMessage,
  startConversation,
} from "@/services/conversation/conversationService";
import { getConfiguredAIProviderName } from "@/services/ai";
import {
  serializeConversation,
  serializeConversationList,
} from "@/services/conversation/serialize";

export async function fetchConversationsAction() {
  const conversations = await listConversations();
  return {
    conversations: serializeConversationList(conversations),
    provider: getConfiguredAIProviderName(),
  };
}

export async function fetchConversationAction(conversationId: string) {
  const conversation = await getConversation(conversationId);
  return serializeConversation(conversation);
}

export async function startConversationAction(input: {
  mode: ConversationMode;
  difficulty: ConversationDifficulty;
  customPrompt?: string;
}) {
  try {
    const conversation = await startConversation(input);
    revalidatePath("/conversation");
    revalidatePath("/dashboard");
    return { ok: true as const, conversation: serializeConversation(conversation) };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to start conversation.",
    };
  }
}

export async function sendMessageAction(input: {
  conversationId: string;
  content: string;
}) {
  try {
    const conversation = await sendConversationMessage(input);
    revalidatePath("/conversation");
    return { ok: true as const, conversation: serializeConversation(conversation) };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to send message.",
    };
  }
}

export async function endConversationAction(conversationId: string) {
  try {
    const conversation = await endConversation(conversationId);
    revalidatePath("/conversation");
    revalidatePath("/review");
    revalidatePath("/dashboard");
    revalidatePath("/vocabulary");
    return { ok: true as const, conversation: serializeConversation(conversation) };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to end/analyze conversation.",
    };
  }
}
