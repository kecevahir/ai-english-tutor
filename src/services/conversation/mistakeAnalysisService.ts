import { prisma } from "@/lib/database/prisma";
import { requireCurrentUser } from "@/lib/database/repositories/userRepository";
import { createAIProvider } from "@/services/ai";
import { AIProviderError } from "@/services/ai/errors";
import { CONVERSATION_ANALYSIS_PROMPT } from "@/prompts/conversationAnalysis";
import { cefrToDisplay } from "@/utils/cn";
import { mapMistakeCategory } from "@/services/conversation/constants";
import { nextReviewDate } from "@/lib/srs/schedule";

/**
 * Phase 3: analyze ended conversation, persist mistakes + vocabulary.
 * Corrections are stored for review; chat was not interrupted mid-turn.
 */
export async function analyzeAndPersistConversation(conversationId: string) {
  const user = await requireCurrentUser();
  const profile = user.profile!;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      mistakes: true,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  // Avoid duplicate mistake rows if review is opened twice
  if (conversation.mistakes.length > 0) {
    return conversation;
  }

  const provider = createAIProvider();
  const transcript = conversation.messages
    .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
    .map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

  let analysis;
  try {
    analysis = await provider.analyzeConversation({
      messages: transcript,
      learnerLevel: cefrToDisplay(profile.overallLevel),
      englishOnlyMode: profile.englishOnlyMode,
    });
  } catch (error) {
    if (error instanceof AIProviderError) {
      throw new Error(
        `${error.message} (Conversation was saved; analysis could not run.)`,
      );
    }
    throw error;
  }

  // Optional: store analysis notes as a system message for review context
  if (analysis.notes) {
    await prisma.conversationMessage.create({
      data: {
        conversationId,
        role: "SYSTEM",
        content: `${CONVERSATION_ANALYSIS_PROMPT.split("\n")[0]}\n\n${analysis.notes}`,
      },
    });
  }

  for (const item of analysis.correctedSentences) {
    const topic = item.subCategory
      ? await prisma.grammarTopic.findFirst({
          where: {
            OR: [
              { name: { equals: item.subCategory, mode: "insensitive" } },
              { slug: item.subCategory.toLowerCase().replace(/\s+/g, "-") },
            ],
          },
        })
      : null;

    await prisma.mistake.create({
      data: {
        userId: user.id,
        conversationId,
        grammarTopicId: topic?.id,
        originalSentence: item.original,
        correctedSentence: item.corrected,
        explanation: item.explanation,
        category: mapMistakeCategory(item.category),
        subCategory: item.subCategory,
        severity: 2,
      },
    });

    if (topic) {
      await prisma.grammarProgress.updateMany({
        where: { userId: user.id, topicId: topic.id },
        data: {
          mistakes: { increment: 1 },
          attempts: { increment: 1 },
          masteryLevel: { decrement: 1 },
          lastPracticed: new Date(),
        },
      });
    }
  }

  for (const word of analysis.extractedVocabulary) {
    const normalized = word.word.trim().toLowerCase();
    if (!normalized) continue;

    const vocabulary = await prisma.vocabulary.upsert({
      where: {
        word_category: {
          word: normalized,
          category: "Conversation",
        },
      },
      create: {
        word: normalized,
        translation: word.translation,
        definition: word.definition,
        exampleSentence: word.exampleSentence,
        category: "Conversation",
      },
      update: {
        translation: word.translation ?? undefined,
        definition: word.definition ?? undefined,
        exampleSentence: word.exampleSentence ?? undefined,
      },
    });

    await prisma.vocabularyProgress.upsert({
      where: {
        userId_vocabularyId: {
          userId: user.id,
          vocabularyId: vocabulary.id,
        },
      },
      create: {
        userId: user.id,
        vocabularyId: vocabulary.id,
        status: "NEW",
        nextReview: nextReviewDate(0),
      },
      update: {
        lastReviewed: new Date(),
      },
    });
  }

  return prisma.conversation.findFirstOrThrow({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      mistakes: {
        orderBy: { createdAt: "asc" },
        include: { grammarTopic: true },
      },
    },
  });
}
