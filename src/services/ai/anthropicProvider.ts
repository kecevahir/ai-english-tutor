import {
  conversationAnalysisSchema,
  lessonPlanSchema,
} from "@/lib/ai/schemas";
import { AIProviderError } from "@/services/ai/errors";
import {
  extractJsonObject,
  fetchWithTimeout,
  getAITimeoutMs,
} from "@/services/ai/http";
import type {
  AIProvider,
  AnalyzeConversationInput,
  EvaluateAnswerInput,
  ExtractVocabularyInput,
  GenerateLessonInput,
  GenerateResponseInput,
} from "@/services/ai/types";

function requireKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new AIProviderError(
      "MISSING_KEY",
      "ANTHROPIC_API_KEY is missing. Set it in .env.local or use AI_PROVIDER=mock.",
    );
  }
  return key;
}

function modelName(fallback: string): string {
  return process.env.AI_MODEL?.trim() || fallback;
}

async function messagesCreate(input: {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<string> {
  const key = requireKey();
  const timeoutMs = getAITimeoutMs();
  const response = await fetchWithTimeout(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName("claude-3-5-haiku-latest"),
        max_tokens: 1024,
        system: input.system,
        messages: input.messages,
      }),
    },
    timeoutMs,
  );

  if (!response.ok) {
    const body = await response.text();
    throw new AIProviderError(
      "PROVIDER",
      `Anthropic error ${response.status}: ${body.slice(0, 300)}`,
    );
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) {
    throw new AIProviderError(
      "INVALID_RESPONSE",
      "Anthropic returned an empty message.",
    );
  }
  return text;
}

function toAnthropicMessages(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}

export function createAnthropicProvider(): AIProvider {
  return {
    name: "anthropic",

    async generateResponse(input: GenerateResponseInput) {
      return messagesCreate({
        system: input.systemPrompt,
        messages: toAnthropicMessages(input.messages),
      });
    },

    async analyzeConversation(input: AnalyzeConversationInput) {
      const raw = await messagesCreate({
        system:
          "Analyze learner English. Return JSON only with correctedSentences, extractedVocabulary, notes.",
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              learnerLevel: input.learnerLevel,
              englishOnlyMode: input.englishOnlyMode,
              messages: input.messages,
            }),
          },
        ],
      });
      return conversationAnalysisSchema.parse(extractJsonObject(raw));
    },

    async generateLesson(input: GenerateLessonInput) {
      const raw = await messagesCreate({
        system: "Create a daily English lesson plan. Return JSON only.",
        messages: [{ role: "user", content: JSON.stringify(input) }],
      });
      return lessonPlanSchema.parse(extractJsonObject(raw));
    },

    async evaluateAnswer(input: EvaluateAnswerInput) {
      const raw = await messagesCreate({
        system:
          'Evaluate the learner answer. Return JSON only: {"isCorrect":boolean,"feedback":string,"correctedAnswer":string}',
        messages: [{ role: "user", content: JSON.stringify(input) }],
      });
      const parsed = extractJsonObject(raw) as {
        isCorrect?: boolean;
        feedback?: string;
        correctedAnswer?: string;
      };
      return {
        isCorrect: Boolean(parsed.isCorrect),
        feedback: parsed.feedback ?? "No feedback returned.",
        correctedAnswer: parsed.correctedAnswer,
      };
    },

    async extractVocabulary(input: ExtractVocabularyInput) {
      const raw = await messagesCreate({
        system:
          'Extract useful vocabulary. Return JSON only: {"words":[{"word":string,"translation":string,"definition":string,"exampleSentence":string}]}',
        messages: [{ role: "user", content: JSON.stringify(input) }],
      });
      const parsed = extractJsonObject(raw) as {
        words?: Array<{
          word: string;
          translation?: string;
          definition?: string;
          exampleSentence?: string;
        }>;
      };
      return { words: parsed.words ?? [] };
    },
  };
}
