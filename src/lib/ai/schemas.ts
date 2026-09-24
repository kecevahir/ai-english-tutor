import { z } from "zod";

export const conversationAnalysisSchema = z.object({
  correctedSentences: z.array(
    z.object({
      original: z.string(),
      corrected: z.string(),
      explanation: z.string().optional(),
      category: z.string(),
      subCategory: z.string().optional(),
    }),
  ),
  extractedVocabulary: z.array(
    z.object({
      word: z.string(),
      translation: z.string().optional(),
      definition: z.string().optional(),
      exampleSentence: z.string().optional(),
    }),
  ),
  notes: z.string().optional(),
});

export type ConversationAnalysis = z.infer<typeof conversationAnalysisSchema>;

export const lessonPlanSchema = z.object({
  title: z.string(),
  estimatedMinutes: z.number().int().positive(),
  recommendation: z.string(),
  activities: z.array(
    z.object({
      type: z.enum([
        "VOCABULARY_REVIEW",
        "GRAMMAR",
        "SPEAKING",
        "LISTENING",
        "CONVERSATION",
        "WRITING",
        "PRONUNCIATION",
      ]),
      title: z.string(),
      description: z.string().optional(),
      estimatedMinutes: z.number().int().positive(),
    }),
  ),
});

export type LessonPlan = z.infer<typeof lessonPlanSchema>;
