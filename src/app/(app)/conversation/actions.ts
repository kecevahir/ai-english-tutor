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

export async function fetchConversationsAction() {
  const [conversations, provider] = await Promise.all([
    listConversations(),
    Promise.resolve(getConfiguredAIProviderName()),
  ]);
  return { conversations, provider };
}

export async function fetchConversationAction(conversationId: string) {
  return getConversation(conversationId);
}

export async function startConversationAction(input: {
  mode: ConversationMode;
  difficulty: ConversationDifficulty;
  customPrompt?: string;
}) {
  const conversation = await startConversation(input);
  revalidatePath("/conversation");
  revalidatePath("/dashboard");
  return conversation;
}

export async function sendMessageAction(input: {
  conversationId: string;
  content: string;
}) {
  try {
    const conversation = await sendConversationMessage(input);
    revalidatePath("/conversation");
    return { ok: true as const, conversation };
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
    return { ok: true as const, conversation };
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
