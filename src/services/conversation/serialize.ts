import type {
  Conversation,
  ConversationMessage,
  GrammarTopic,
  Mistake,
} from "@prisma/client";

export type SerializedMessage = {
  id: string;
  conversationId: string;
  role: ConversationMessage["role"];
  content: string;
  audioUrl: string | null;
  createdAt: string;
};

export type SerializedMistake = {
  id: string;
  userId: string;
  conversationId: string | null;
  grammarTopicId: string | null;
  originalSentence: string;
  correctedSentence: string;
  explanation: string | null;
  category: Mistake["category"];
  subCategory: string | null;
  severity: number;
  reviewCount: number;
  lastReviewedAt: string | null;
  mastered: boolean;
  createdAt: string;
  updatedAt: string;
  grammarTopic: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    cefrBand: GrammarTopic["cefrBand"];
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type SerializedConversation = {
  id: string;
  userId: string;
  mode: Conversation["mode"];
  difficulty: Conversation["difficulty"];
  customPrompt: string | null;
  title: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages: SerializedMessage[];
  mistakes: SerializedMistake[];
};

export type SerializedConversationListItem = {
  id: string;
  userId: string;
  mode: Conversation["mode"];
  difficulty: Conversation["difficulty"];
  customPrompt: string | null;
  title: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number; mistakes: number };
};

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export function serializeConversation(
  conversation: Conversation & {
    messages: ConversationMessage[];
    mistakes: Array<Mistake & { grammarTopic: GrammarTopic | null }>;
  },
): SerializedConversation {
  return {
    id: conversation.id,
    userId: conversation.userId,
    mode: conversation.mode,
    difficulty: conversation.difficulty,
    customPrompt: conversation.customPrompt,
    title: conversation.title,
    startedAt: conversation.startedAt.toISOString(),
    endedAt: iso(conversation.endedAt),
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: conversation.messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      audioUrl: m.audioUrl,
      createdAt: m.createdAt.toISOString(),
    })),
    mistakes: conversation.mistakes.map((m) => ({
      id: m.id,
      userId: m.userId,
      conversationId: m.conversationId,
      grammarTopicId: m.grammarTopicId,
      originalSentence: m.originalSentence,
      correctedSentence: m.correctedSentence,
      explanation: m.explanation,
      category: m.category,
      subCategory: m.subCategory,
      severity: m.severity,
      reviewCount: m.reviewCount,
      lastReviewedAt: iso(m.lastReviewedAt),
      mastered: m.mastered,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      grammarTopic: m.grammarTopic
        ? {
            id: m.grammarTopic.id,
            slug: m.grammarTopic.slug,
            name: m.grammarTopic.name,
            description: m.grammarTopic.description,
            cefrBand: m.grammarTopic.cefrBand,
            createdAt: m.grammarTopic.createdAt.toISOString(),
            updatedAt: m.grammarTopic.updatedAt.toISOString(),
          }
        : null,
    })),
  };
}

export function serializeConversationList(
  items: Array<
    Conversation & { _count: { messages: number; mistakes: number } }
  >,
): SerializedConversationListItem[] {
  return items.map((item) => ({
    id: item.id,
    userId: item.userId,
    mode: item.mode,
    difficulty: item.difficulty,
    customPrompt: item.customPrompt,
    title: item.title,
    startedAt: item.startedAt.toISOString(),
    endedAt: iso(item.endedAt),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    _count: item._count,
  }));
}
