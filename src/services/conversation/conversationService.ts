import {
  ConversationDifficulty,
  ConversationMode,
  MessageRole,
} from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { requireCurrentUser } from "@/lib/database/repositories/userRepository";
import { createAIProvider } from "@/services/ai";
import { AIProviderError } from "@/services/ai/errors";
import { ENGLISH_TUTOR_SYSTEM_PROMPT } from "@/prompts/englishTutor";
import { cefrToDisplay } from "@/utils/cn";
import {
  buildConversationSystemPrompt,
  modeLabel,
} from "@/services/conversation/constants";
import { analyzeAndPersistConversation } from "@/services/conversation/mistakeAnalysisService";

export async function listConversations(limit = 20) {
  const user = await requireCurrentUser();
  return prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      _count: { select: { messages: true, mistakes: true } },
    },
  });
}

export async function getConversation(conversationId: string) {
  const user = await requireCurrentUser();
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      mistakes: {
        orderBy: { createdAt: "asc" },
        include: { grammarTopic: true },
      },
    },
  });
  if (!conversation) {
    throw new Error("Conversation not found.");
  }
  return conversation;
}

export async function startConversation(input: {
  mode: ConversationMode;
  difficulty: ConversationDifficulty;
  customPrompt?: string;
}) {
  const user = await requireCurrentUser();
  const profile = user.profile!;
  const title = `${modeLabel(input.mode)} · ${new Date().toLocaleString()}`;

  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      mode: input.mode,
      difficulty: input.difficulty,
      customPrompt: input.customPrompt?.trim() || null,
      title,
      messages: {
        create: {
          role: MessageRole.ASSISTANT,
          content: openingMessage(input.mode, cefrToDisplay(profile.overallLevel)),
        },
      },
    },
  });

  await prisma.userProfile.update({
    where: { userId: user.id },
    data: { conversationsCount: { increment: 1 } },
  });

  return getConversation(conversation.id);
}

function openingMessage(mode: ConversationMode, level: string): string {
  switch (mode) {
    case "TRAVEL":
      return `Welcome. Let's practice travel English at ${level}. Where are you going, and how will you get there?`;
    case "BUSINESS":
      return `Let's practice a business conversation at ${level}. What project or meeting should we talk about?`;
    case "RESTAURANT":
      return `We're at a restaurant. At ${level}, how would you start — ask for a table or order drinks?`;
    case "JOB_INTERVIEW":
      return `This is a practice job interview at ${level}. Please introduce yourself and your recent experience.`;
    case "CUSTOM":
      return `Custom scenario ready. Tell me how you'd like to begin.`;
    default:
      return `Hi — ready for ${modeLabel(mode).toLowerCase()} practice at ${level}. What's on your mind today?`;
  }
}

export async function sendConversationMessage(input: {
  conversationId: string;
  content: string;
}) {
  const content = input.content.trim();
  if (!content) {
    throw new Error("Message cannot be empty.");
  }

  const user = await requireCurrentUser();
  const profile = user.profile!;
  const conversation = await prisma.conversation.findFirst({
    where: { id: input.conversationId, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) {
    throw new Error("Conversation not found.");
  }
  if (conversation.endedAt) {
    throw new Error("This conversation has ended. Start a new one to continue.");
  }

  await prisma.conversationMessage.create({
    data: {
      conversationId: conversation.id,
      role: MessageRole.USER,
      content,
    },
  });

  const provider = createAIProvider();
  const systemPrompt = buildConversationSystemPrompt({
    basePrompt: ENGLISH_TUTOR_SYSTEM_PROMPT,
    mode: conversation.mode,
    difficulty: conversation.difficulty,
    englishOnlyMode: profile.englishOnlyMode,
    learnerLevel: cefrToDisplay(profile.overallLevel),
    customPrompt: conversation.customPrompt,
  });

  const history = [
    ...conversation.messages.map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content },
  ].filter((m) => m.role === "user" || m.role === "assistant");

  let assistantText: string;
  try {
    assistantText = await provider.generateResponse({
      systemPrompt,
      messages: history,
      englishOnlyMode: profile.englishOnlyMode,
      learnerLevel: cefrToDisplay(profile.overallLevel),
    });
  } catch (error) {
    if (error instanceof AIProviderError) {
      throw new Error(error.message);
    }
    throw error;
  }

  await prisma.conversationMessage.create({
    data: {
      conversationId: conversation.id,
      role: MessageRole.ASSISTANT,
      content: assistantText,
    },
  });

  return getConversation(conversation.id);
}

export async function endConversation(conversationId: string) {
  const user = await requireCurrentUser();
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
  });
  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  if (!conversation.endedAt) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { endedAt: new Date() },
    });
  }

  await analyzeAndPersistConversation(conversationId);
  return getConversation(conversationId);
}
