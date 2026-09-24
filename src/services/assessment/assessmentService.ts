import { CefrLevel, SkillType } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { requireCurrentUser } from "@/lib/database/repositories/userRepository";
import { cefrToDisplay } from "@/utils/cn";
import { generateTodaysLesson } from "@/services/lesson/lessonService";

export type AssessmentSection = "reading" | "writing" | "listening" | "speaking";

export type AssessmentQuestion = {
  id: string;
  section: AssessmentSection;
  prompt: string;
  /** Shown for reading; hidden for listening (audio only). */
  passage?: string;
  /** Spoken aloud for listening via browser TTS. */
  audioText?: string;
  options?: string[];
  correctIndex?: number;
  /** speaking | writing use free text / speech transcript */
  input?: "choice" | "text" | "speech";
};

const QUESTIONS: AssessmentQuestion[] = [
  // —— Reading ——
  {
    id: "r1",
    section: "reading",
    passage:
      "Last Friday, Ana arrived at the office early because she had an important meeting with a new client. She prepared her notes carefully and practiced her presentation twice.",
    prompt: "Why did Ana arrive early?",
    options: [
      "She missed the bus",
      "She had an important meeting",
      "She wanted free coffee",
      "Her boss asked her to clean",
    ],
    correctIndex: 1,
    input: "choice",
  },
  {
    id: "r2",
    section: "reading",
    passage:
      "Although the weather was cold, the team decided to walk to the restaurant instead of taking a taxi. They wanted to save money and get some fresh air.",
    prompt: "What is true according to the text?",
    options: [
      "They took a taxi",
      "It was warm outside",
      "They walked to save money",
      "They cancelled dinner",
    ],
    correctIndex: 2,
    input: "choice",
  },
  {
    id: "r3",
    section: "reading",
    passage:
      "If companies invest more in training, employees usually become more confident and productive. However, training only works when managers support what staff learn in class.",
    prompt: "What does the writer suggest?",
    options: [
      "Training is never useful",
      "Manager support matters for training",
      "Employees dislike confidence",
      "Companies should stop investing",
    ],
    correctIndex: 1,
    input: "choice",
  },

  // —— Writing ——
  {
    id: "w1",
    section: "writing",
    prompt:
      "Write 4–6 sentences about your typical workday or school day. Use past or present tense.",
    input: "text",
  },
  {
    id: "w2",
    section: "writing",
    prompt:
      "Describe a problem you solved recently. What was the problem and what did you do?",
    input: "text",
  },

  // —— Listening ——
  {
    id: "l1",
    section: "listening",
    audioText:
      "Tomorrow morning, the train to Manchester leaves at eight fifteen from platform four. Please arrive ten minutes early.",
    prompt: "Listen, then answer: What time does the train leave?",
    options: ["7:15", "8:15", "8:50", "9:15"],
    correctIndex: 1,
    input: "choice",
  },
  {
    id: "l2",
    section: "listening",
    audioText:
      "Hi Sam, this is Claire. I cannot join the project call today because I am visiting a client. Please email me the notes after the meeting.",
    prompt: "Why can't Claire join the call?",
    options: [
      "She is sick",
      "She is visiting a client",
      "She lost her phone",
      "The call was cancelled",
    ],
    correctIndex: 1,
    input: "choice",
  },
  {
    id: "l3",
    section: "listening",
    audioText:
      "To reset your password, tap Forgot Password, enter your email address, and then check your inbox for a six-digit code.",
    prompt: "What should you check after entering your email?",
    options: [
      "Your bank account",
      "Your inbox for a code",
      "The company calendar",
      "A paper form",
    ],
    correctIndex: 1,
    input: "choice",
  },

  // —— Speaking ——
  {
    id: "s1",
    section: "speaking",
    prompt:
      "Speak for about 20–30 seconds: Introduce yourself and say what you do.",
    input: "speech",
  },
  {
    id: "s2",
    section: "speaking",
    prompt:
      "Speak about last weekend. Where did you go and what did you enjoy?",
    input: "speech",
  },
];

export function getAssessmentQuestions() {
  return QUESTIONS;
}

function scoreToLevel(score: number): CefrLevel {
  if (score >= 90) return CefrLevel.C1;
  if (score >= 80) return CefrLevel.B2_PLUS;
  if (score >= 70) return CefrLevel.B2;
  if (score >= 60) return CefrLevel.B1_PLUS;
  if (score >= 50) return CefrLevel.B1;
  if (score >= 35) return CefrLevel.A2;
  return CefrLevel.A1;
}

function textQualityScore(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  const words = cleaned.split(/\s+/).filter(Boolean);
  const wordScore = Math.min(70, words.length * 4);
  const sentenceBonus = Math.min(20, (cleaned.match(/[.!?]/g) || []).length * 8);
  const varietyBonus = new Set(words.map((w) => w.toLowerCase())).size > 8 ? 10 : 0;
  return Math.min(100, wordScore + sentenceBonus + varietyBonus);
}

export async function submitAssessment(
  answers: Record<string, string | number>,
) {
  const user = await requireCurrentUser();

  const bySection: Record<AssessmentSection, number[]> = {
    reading: [],
    writing: [],
    listening: [],
    speaking: [],
  };

  for (const question of QUESTIONS) {
    const answer = answers[question.id];
    if (question.input === "choice" && question.correctIndex != null) {
      const score = answer === question.correctIndex ? 100 : 0;
      bySection[question.section].push(score);
    } else {
      bySection[question.section].push(textQualityScore(String(answer ?? "")));
    }
  }

  const avg = (values: number[]) =>
    values.length === 0
      ? 0
      : values.reduce((sum, value) => sum + value, 0) / values.length;

  const readingScore = avg(bySection.reading);
  const writingScore = avg(bySection.writing);
  const listeningScore = avg(bySection.listening);
  const speakingScore = avg(bySection.speaking);
  const overallScore = Math.round(
    readingScore * 0.25 +
      writingScore * 0.25 +
      listeningScore * 0.25 +
      speakingScore * 0.25,
  );
  const overallLevel = scoreToLevel(overallScore);

  const updates: Array<{ skill: SkillType; level: CefrLevel; score: number }> =
    [
      {
        skill: SkillType.LISTENING,
        level: scoreToLevel(listeningScore),
        score: listeningScore,
      },
      {
        skill: SkillType.SPEAKING,
        level: scoreToLevel(speakingScore),
        score: speakingScore,
      },
      {
        skill: SkillType.WRITING,
        level: scoreToLevel(writingScore),
        score: writingScore,
      },
      {
        skill: SkillType.PRONUNCIATION,
        level: scoreToLevel(Math.max(speakingScore - 5, 0)),
        score: Math.max(speakingScore - 5, 0),
      },
      {
        skill: SkillType.VOCABULARY,
        level: scoreToLevel((readingScore + writingScore) / 2),
        score: (readingScore + writingScore) / 2,
      },
      {
        skill: SkillType.GRAMMAR,
        level: scoreToLevel((readingScore + writingScore) / 2),
        score: (readingScore + writingScore) / 2,
      },
    ];

  for (const item of updates) {
    await prisma.skillProgress.upsert({
      where: {
        userId_skill: { userId: user.id, skill: item.skill },
      },
      create: {
        userId: user.id,
        skill: item.skill,
        level: item.level,
        score: item.score,
        lastPracticed: new Date(),
      },
      update: {
        level: item.level,
        score: item.score,
        lastPracticed: new Date(),
      },
    });
  }

  await prisma.userProfile.update({
    where: { userId: user.id },
    data: {
      overallLevel,
      assessmentCompleted: true,
    },
  });

  // Build first adaptive lesson from the new level
  try {
    await generateTodaysLesson();
  } catch {
    // non-fatal — lesson page can regenerate later
  }

  return {
    overallLevel: cefrToDisplay(overallLevel),
    skills: [
      {
        skill: "READING",
        level: cefrToDisplay(scoreToLevel(readingScore)),
        score: Math.round(readingScore),
      },
      {
        skill: "WRITING",
        level: cefrToDisplay(scoreToLevel(writingScore)),
        score: Math.round(writingScore),
      },
      {
        skill: "LISTENING",
        level: cefrToDisplay(scoreToLevel(listeningScore)),
        score: Math.round(listeningScore),
      },
      {
        skill: "SPEAKING",
        level: cefrToDisplay(scoreToLevel(speakingScore)),
        score: Math.round(speakingScore),
      },
    ],
    readingScore: Math.round(readingScore),
    writingScore: Math.round(writingScore),
    listeningScore: Math.round(listeningScore),
    speakingScore: Math.round(speakingScore),
  };
}
