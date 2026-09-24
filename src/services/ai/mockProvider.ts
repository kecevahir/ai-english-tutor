import type {
  AIProvider,
  AnalyzeConversationInput,
  EvaluateAnswerInput,
  ExtractVocabularyInput,
  GenerateLessonInput,
  GenerateResponseInput,
} from "@/services/ai/types";
import { AIProviderError } from "@/services/ai/errors";

/**
 * Deterministic stub used when no AI API key is configured.
 * Does not invent successful external API calls — callers know provider is "mock".
 */
export function createMockAIProvider(): AIProvider {
  return {
    name: "mock",

    async generateResponse(input: GenerateResponseInput): Promise<string> {
      const lastUser = [...input.messages]
        .reverse()
        .find((m) => m.role === "user");
      return [
        `(Mock AI · level ${input.learnerLevel})`,
        "I'm ready to practice with you once an AI provider key is configured.",
        lastUser
          ? `You said: "${lastUser.content.slice(0, 120)}"`
          : "What would you like to talk about today?",
      ].join(" ");
    },

    async analyzeConversation(input: AnalyzeConversationInput) {
      void input;
      return {
        correctedSentences: [],
        extractedVocabulary: [],
        notes: "Mock provider: conversation analysis requires a real AI_PROVIDER key.",
      };
    },

    async generateLesson(input: GenerateLessonInput) {
      const focus = input.weakAreas[0] ?? "General conversation";
      return {
        title: `Focus: ${focus}`,
        estimatedMinutes: 25,
        recommendation: `Practice ${focus} based on your recent learning profile.`,
        activities: [
          {
            type: "VOCABULARY_REVIEW",
            title: "Vocabulary Review",
            description: `${Math.max(input.vocabularyDue.length, 8)} words due`,
            estimatedMinutes: 5,
          },
          {
            type: "GRAMMAR",
            title: focus,
            estimatedMinutes: 7,
          },
          {
            type: "SPEAKING",
            title: "Speaking practice",
            description: `Topic related to ${focus}`,
            estimatedMinutes: 8,
          },
          {
            type: "LISTENING",
            title: `${input.learnerLevel} short conversation`,
            estimatedMinutes: 5,
          },
        ],
      };
    },

    async evaluateAnswer(input: EvaluateAnswerInput) {
      if (input.expected) {
        const ok =
          input.answer.trim().toLowerCase() ===
          input.expected.trim().toLowerCase();
        return {
          isCorrect: ok,
          feedback: ok
            ? "Correct."
            : `Expected something like: ${input.expected}`,
          correctedAnswer: input.expected,
        };
      }
      return {
        isCorrect: false,
        feedback:
          "Mock provider cannot grade free-form answers without AI_PROVIDER keys.",
      };
    },

    async extractVocabulary(input: ExtractVocabularyInput) {
      void input;
      return { words: [] };
    },
  };
}

export function assertRealAIProviderConfigured(): never {
  throw new AIProviderError(
    "MISSING_KEY",
    "No AI API key configured. Set AI_PROVIDER and the matching key in .env.local (see .env.example).",
  );
}
