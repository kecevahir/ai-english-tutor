import type {
  ConversationDifficulty,
  ConversationMode,
  MistakeCategory,
} from "@prisma/client";

export const CONVERSATION_MODES: Array<{
  value: ConversationMode;
  label: string;
}> = [
  { value: "FREE", label: "Free Conversation" },
  { value: "DAILY_LIFE", label: "Daily Life" },
  { value: "TRAVEL", label: "Travel" },
  { value: "BUSINESS", label: "Business" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "HOTEL", label: "Hotel" },
  { value: "AIRPORT", label: "Airport" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "PHONE_CALL", label: "Phone Call" },
  { value: "MEETING", label: "Meeting" },
  { value: "JOB_INTERVIEW", label: "Job Interview" },
  { value: "DEBATE", label: "Debate" },
  { value: "CUSTOM", label: "Custom Scenario" },
];

export const CONVERSATION_DIFFICULTIES: Array<{
  value: ConversationDifficulty;
  label: string;
}> = [
  { value: "EASY", label: "Easy" },
  { value: "NORMAL", label: "Normal" },
  { value: "CHALLENGING", label: "Challenging" },
  { value: "ADAPTIVE", label: "Adaptive" },
];

export function modeLabel(mode: ConversationMode): string {
  return CONVERSATION_MODES.find((m) => m.value === mode)?.label ?? mode;
}

export function difficultyLabel(value: ConversationDifficulty): string {
  return (
    CONVERSATION_DIFFICULTIES.find((d) => d.value === value)?.label ?? value
  );
}

export function mapMistakeCategory(raw: string): MistakeCategory {
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, "_");
  const allowed: MistakeCategory[] = [
    "GRAMMAR",
    "VOCABULARY",
    "WORD_CHOICE",
    "WORD_ORDER",
    "PREPOSITION",
    "ARTICLE",
    "TENSE",
    "PRONUNCIATION",
    "SPELLING",
    "NATURAL_EXPRESSION",
  ];
  if (allowed.includes(normalized as MistakeCategory)) {
    return normalized as MistakeCategory;
  }
  if (normalized.includes("TENSE") || normalized.includes("PAST")) return "TENSE";
  if (normalized.includes("ARTICLE")) return "ARTICLE";
  if (normalized.includes("PREPOSITION")) return "PREPOSITION";
  if (normalized.includes("NATURAL")) return "NATURAL_EXPRESSION";
  if (normalized.includes("WORD_CHOICE") || normalized.includes("VOCAB")) {
    return "VOCABULARY";
  }
  return "GRAMMAR";
}

export function buildConversationSystemPrompt(input: {
  basePrompt: string;
  mode: ConversationMode;
  difficulty: ConversationDifficulty;
  englishOnlyMode: boolean;
  learnerLevel: string;
  customPrompt?: string | null;
}): string {
  const modeText = modeLabel(input.mode);
  const difficultyText = difficultyLabel(input.difficulty);
  const languageRule = input.englishOnlyMode
    ? "English Only Mode is ON. Reply only in English."
    : "English Only Mode is OFF. Prefer English, but brief Turkish explanations are allowed when helpful.";

  return [
    input.basePrompt,
    `Learner CEFR level: ${input.learnerLevel}.`,
    `Conversation mode: ${modeText}.`,
    `Difficulty: ${difficultyText}.`,
    languageRule,
    "Do not correct every minor mistake mid-conversation. Keep the dialogue natural.",
    input.customPrompt
      ? `Custom scenario instructions: ${input.customPrompt}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
