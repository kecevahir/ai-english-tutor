import type {
  ConversationAnalysis,
  LessonPlan,
} from "@/lib/ai/schemas";
import type { CefrLevelCode } from "@/types/learning";

export interface GenerateResponseInput {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  englishOnlyMode: boolean;
  learnerLevel: CefrLevelCode;
}

export interface AnalyzeConversationInput {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  learnerLevel: CefrLevelCode;
  englishOnlyMode: boolean;
}

export interface GenerateLessonInput {
  learnerLevel: CefrLevelCode;
  weakAreas: string[];
  strongAreas: string[];
  vocabularyDue: string[];
  recentMistakeCategories: string[];
}

export interface EvaluateAnswerInput {
  prompt: string;
  answer: string;
  expected?: string;
  learnerLevel: CefrLevelCode;
}

export interface ExtractVocabularyInput {
  text: string;
  learnerLevel: CefrLevelCode;
}

export interface EvaluateAnswerResult {
  isCorrect: boolean;
  feedback: string;
  correctedAnswer?: string;
}

export interface ExtractVocabularyResult {
  words: Array<{
    word: string;
    translation?: string;
    definition?: string;
    exampleSentence?: string;
  }>;
}

/**
 * Provider-independent AI contract.
 * Swap implementations without changing callers.
 */
export interface AIProvider {
  readonly name: string;
  generateResponse(input: GenerateResponseInput): Promise<string>;
  analyzeConversation(
    input: AnalyzeConversationInput,
  ): Promise<ConversationAnalysis>;
  generateLesson(input: GenerateLessonInput): Promise<LessonPlan>;
  evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluateAnswerResult>;
  extractVocabulary(
    input: ExtractVocabularyInput,
  ): Promise<ExtractVocabularyResult>;
}
