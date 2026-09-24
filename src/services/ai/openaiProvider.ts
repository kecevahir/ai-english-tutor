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
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new AIProviderError(
      "MISSING_KEY",
      "OPENAI_API_KEY is missing. Set it in .env.local or use AI_PROVIDER=mock.",
    );
  }
  return key;
}

function modelName(fallback: string): string {
  return process.env.AI_MODEL?.trim() || fallback;
}

async function chatCompletion(input: {
  messages: Array<{ role: string; content: string }>;
  json?: boolean;
}): Promise<string> {
  const key = requireKey();
  const timeoutMs = getAITimeoutMs();
  const response = await fetchWithTimeout(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName("gpt-4o-mini"),
        messages: input.messages,
        temperature: 0.7,
        ...(input.json
          ? { response_format: { type: "json_object" } }
          : undefined),
      }),
    },
    timeoutMs,
  );

  if (!response.ok) {
    const body = await response.text();
    throw new AIProviderError(
      "PROVIDER",
      `OpenAI error ${response.status}: ${body.slice(0, 300)}`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AIProviderError(
      "INVALID_RESPONSE",
      "OpenAI returned an empty message.",
    );
  }
  return content;
}

export function createOpenAIProvider(): AIProvider {
  return {
    name: "openai",

    async generateResponse(input: GenerateResponseInput) {
      return chatCompletion({
        messages: [
          { role: "system", content: input.systemPrompt },
          ...input.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      });
    },

    async analyzeConversation(input: AnalyzeConversationInput) {
      const raw = await chatCompletion({
        json: true,
        messages: [
          {
            role: "system",
            content:
              "Analyze learner English. Return JSON with correctedSentences, extractedVocabulary, notes.",
          },
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
      const raw = await chatCompletion({
        json: true,
        messages: [
          {
            role: "system",
            content: "Create a daily English lesson plan as JSON.",
          },
          { role: "user", content: JSON.stringify(input) },
        ],
      });
      return lessonPlanSchema.parse(extractJsonObject(raw));
    },

    async evaluateAnswer(input: EvaluateAnswerInput) {
      const raw = await chatCompletion({
        json: true,
        messages: [
          {
            role: "system",
            content:
              'Evaluate the learner answer. Return JSON: {"isCorrect":boolean,"feedback":string,"correctedAnswer":string}',
          },
          { role: "user", content: JSON.stringify(input) },
        ],
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
      const raw = await chatCompletion({
        json: true,
        messages: [
          {
            role: "system",
            content:
              'Extract useful vocabulary. Return JSON: {"words":[{"word":string,"translation":string,"definition":string,"exampleSentence":string}]}',
          },
          { role: "user", content: JSON.stringify(input) },
        ],
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
