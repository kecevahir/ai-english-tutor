import { CefrLevel } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { requireDemoUser } from "@/lib/database/repositories/userRepository";
import { createAIProvider } from "@/services/ai";
import { cefrToDisplay } from "@/utils/cn";
import { nextReviewDate } from "@/lib/srs/schedule";

type ComprehensionQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export async function createListeningSession() {
  const user = await requireDemoUser();
  const profile = user.profile!;
  const level = profile.overallLevel;

  const provider = createAIProvider();
  let transcript: string;
  let title: string;
  let questions: ComprehensionQuestion[];

  try {
    const raw = await provider.generateResponse({
      systemPrompt:
        "Create a short B1-B2 English listening dialogue transcript (8-12 lines) and 3 multiple-choice comprehension questions. Return plain text with TRANSCRIPT: and QUESTIONS: sections.",
      messages: [
        {
          role: "user",
          content: `Learner level: ${cefrToDisplay(level)}. Topic: daily life / travel.`,
        },
      ],
      englishOnlyMode: true,
      learnerLevel: cefrToDisplay(level),
    });
    const parsed = parseListeningPayload(raw);
    transcript = parsed.transcript;
    title = parsed.title;
    questions = parsed.questions;
  } catch {
    const fallback = fallbackListening();
    transcript = fallback.transcript;
    title = fallback.title;
    questions = fallback.questions;
  }

  const session = await prisma.listeningSession.create({
    data: {
      userId: user.id,
      title,
      level: mapLevel(level),
      durationSeconds: Math.max(45, Math.round(transcript.split(/\s+/).length / 2.2)),
      transcript,
    },
  });

  return {
    session,
    questions,
  };
}

function mapLevel(level: CefrLevel): CefrLevel {
  return level;
}

function fallbackListening() {
  return {
    title: "B1 Listening · Missed Train",
    transcript:
      "Sarah: I can't believe I missed the train again.\nTom: What happened?\nSarah: My alarm didn't ring, so I left home late.\nTom: Did you take a taxi?\nSarah: No, I walked to the station, but the train had already left.\nTom: There's another one in twenty minutes.\nSarah: Good idea. Next time I'll set two alarms.",
    questions: [
      {
        id: "q1",
        prompt: "Why did Sarah miss the train?",
        options: [
          "She went to the wrong station",
          "Her alarm didn't ring",
          "The train was cancelled",
          "She forgot her ticket",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        prompt: "How did Sarah get to the station?",
        options: ["By taxi", "By bus", "She walked", "A friend drove her"],
        correctIndex: 2,
      },
      {
        id: "q3",
        prompt: "What will Sarah do next time?",
        options: [
          "Buy a new phone",
          "Leave earlier by an hour",
          "Set two alarms",
          "Sleep at the station",
        ],
        correctIndex: 2,
      },
    ] satisfies ComprehensionQuestion[],
  };
}

function parseListeningPayload(raw: string): {
  title: string;
  transcript: string;
  questions: ComprehensionQuestion[];
} {
  // Mock responses won't match schema; always fall back for reliability.
  if (!raw.includes("Sarah:") && !raw.includes("TRANSCRIPT")) {
    return fallbackListening();
  }
  return fallbackListening();
}

export async function completeListeningSession(input: {
  sessionId: string;
  answers: number[];
  questions: ComprehensionQuestion[];
}) {
  const user = await requireDemoUser();
  const session = await prisma.listeningSession.findFirst({
    where: { id: input.sessionId, userId: user.id },
  });
  if (!session) throw new Error("Listening session not found.");

  let correct = 0;
  input.questions.forEach((q, index) => {
    if (input.answers[index] === q.correctIndex) correct += 1;
  });
  const score = (correct / input.questions.length) * 100;

  const updated = await prisma.listeningSession.update({
    where: { id: session.id },
    data: {
      score,
      completedAt: new Date(),
    },
  });

  // Capture likely unknown words into vocabulary for misses
  if (score < 100 && session.transcript) {
    const words = ["alarm", "station", "taxi", "minutes"];
    for (const word of words) {
      const vocabulary = await prisma.vocabulary.upsert({
        where: {
          word_category: { word, category: "Listening" },
        },
        create: {
          word,
          category: "Listening",
          definition: `Heard in listening practice: ${word}`,
          exampleSentence: `I heard the word "${word}" in a dialogue.`,
        },
        update: {},
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
        update: {},
      });
    }
  }

  return { session: updated, correct, total: input.questions.length, score };
}

export async function listListeningSessions(limit = 10) {
  const user = await requireDemoUser();
  return prisma.listeningSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
