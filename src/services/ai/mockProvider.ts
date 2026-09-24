import type { ConversationAnalysis } from "@/lib/ai/schemas";
import type {
  AIProvider,
  AnalyzeConversationInput,
  EvaluateAnswerInput,
  ExtractVocabularyInput,
  GenerateLessonInput,
  GenerateResponseInput,
} from "@/services/ai/types";

const MODE_HINTS = [
  "travel",
  "business",
  "restaurant",
  "hotel",
  "airport",
  "shopping",
  "meeting",
  "interview",
];

function heuristicCorrections(text: string): ConversationAnalysis["correctedSentences"] {
  const findings: ConversationAnalysis["correctedSentences"] = [];
  const lower = text.toLowerCase();

  if (/\bi go to\b/.test(lower) && /\byesterday\b|\blast\b/.test(lower)) {
    findings.push({
      original: text,
      corrected: text
        .replace(/\bgo\b/i, "went")
        .replace(/\bmeet\b/i, "met")
        .replace(/\bcustomer\b/i, "client"),
      explanation:
        "Use Past Simple for finished past actions (go → went, meet → met).",
      category: "Grammar",
      subCategory: "Past Simple",
    });
  }

  if (/\bi have went\b/i.test(text)) {
    findings.push({
      original: text,
      corrected: text.replace(/have went/i, "have gone"),
      explanation: 'Present Perfect uses the past participle: "have gone".',
      category: "Grammar",
      subCategory: "Present Perfect",
    });
  }

  if (/\bi am agree\b/i.test(text)) {
    findings.push({
      original: text,
      corrected: text.replace(/i am agree/i, "I agree"),
      explanation: 'Say "I agree", not "I am agree".',
      category: "Natural Expression",
      subCategory: "Collocation",
    });
  }

  return findings;
}

function replyFor(input: GenerateResponseInput): string {
  const lastUser = [...input.messages]
    .reverse()
    .find((m) => m.role === "user")?.content;
  const level = input.learnerLevel;
  const bilingualHint = input.englishOnlyMode
    ? ""
    : " (If you need a short Turkish tip later, ask.)";

  if (!lastUser) {
    return `Let's practice at ${level}. What would you like to talk about today?${bilingualHint}`;
  }

  const lowered = lastUser.toLowerCase();
  const topic =
    MODE_HINTS.find((hint) => lowered.includes(hint)) ?? "everyday life";

  return [
    `Thanks for sharing that.`,
    `At ${level}, try to add one more detail — for example, when it happened and how you felt.`,
    `Let's stay on ${topic}: what happened next?`,
    bilingualHint.trim(),
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Deterministic local tutor used when AI_PROVIDER=mock.
 * Clearly labeled via provider.name === "mock" in the UI.
 * Does not pretend to call an external LLM.
 */
export function createMockAIProvider(): AIProvider {
  return {
    name: "mock",

    async generateResponse(input: GenerateResponseInput): Promise<string> {
      return replyFor(input);
    },

    async analyzeConversation(input: AnalyzeConversationInput) {
      const userTurns = input.messages.filter((m) => m.role === "user");
      const correctedSentences = userTurns.flatMap((m) =>
        heuristicCorrections(m.content),
      );

      const extractedVocabulary = userTurns
        .flatMap((m) => m.content.split(/[^a-zA-Z'-]+/))
        .map((w) => w.toLowerCase())
        .filter((w) => w.length > 5)
        .slice(0, 5)
        .map((word) => ({
          word,
          definition: `Word noticed in conversation: ${word}`,
          exampleSentence: `I practiced the word "${word}" today.`,
        }));

      return {
        correctedSentences,
        extractedVocabulary,
        notes:
          correctedSentences.length > 0
            ? "Mock analyzer found likely grammar issues. Connect a real AI provider for fuller analysis."
            : "Mock analyzer found no pattern-based issues. Connect a real AI provider for deeper review.",
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
          "Mock provider cannot grade free-form answers without a real AI_PROVIDER key.",
      };
    },

    async extractVocabulary(input: ExtractVocabularyInput) {
      const words = input.text
        .split(/[^a-zA-Z'-]+/)
        .map((w) => w.toLowerCase())
        .filter((w) => w.length > 5)
        .slice(0, 8)
        .map((word) => ({ word }));
      return { words };
    },
  };
}
