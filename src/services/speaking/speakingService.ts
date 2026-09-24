import { prisma } from "@/lib/database/prisma";
import { requireDemoUser } from "@/lib/database/repositories/userRepository";
import { createAIProvider } from "@/services/ai";
import { cefrToDisplay } from "@/utils/cn";
import { ENGLISH_TUTOR_SYSTEM_PROMPT } from "@/prompts/englishTutor";

const SPEAKING_PROMPTS = [
  "Tell me about your typical working day.",
  "What did you do last weekend?",
  "What would you do if you had one month off?",
  "Describe a challenge you solved recently.",
  "Talk about a trip you enjoyed.",
];

export async function startSpeakingSession(topic?: string) {
  const user = await requireDemoUser();
  const prompt =
    topic?.trim() ||
    SPEAKING_PROMPTS[Math.floor(Math.random() * SPEAKING_PROMPTS.length)]!;

  const session = await prisma.speakingSession.create({
    data: {
      userId: user.id,
      topic: prompt,
    },
  });

  return session;
}

export async function submitSpeakingAnswer(input: {
  sessionId: string;
  transcript: string;
  durationSeconds: number;
}) {
  const user = await requireDemoUser();
  const profile = user.profile!;
  const session = await prisma.speakingSession.findFirst({
    where: { id: input.sessionId, userId: user.id },
  });
  if (!session) throw new Error("Speaking session not found.");

  const transcript = input.transcript.trim();
  if (!transcript) throw new Error("Transcript is empty.");

  const provider = createAIProvider();
  const analysisPrompt = [
    ENGLISH_TUTOR_SYSTEM_PROMPT,
    "Analyze this spoken answer. Return concise notes for Grammar, Fluency, Vocabulary, Pronunciation/Naturalness, and one Focus Area.",
    "Do not invent a numeric total score. Be specific and practical.",
  ].join("\n");

  let notes: string;
  try {
    notes = await provider.generateResponse({
      systemPrompt: analysisPrompt,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            prompt: session.topic,
            transcript,
            level: cefrToDisplay(profile.overallLevel),
          }),
        },
      ],
      englishOnlyMode: profile.englishOnlyMode,
      learnerLevel: cefrToDisplay(profile.overallLevel),
    });
  } catch {
    notes = heuristicSpeakingNotes(transcript);
  }

  const parsed = splitSpeakingNotes(notes, transcript);

  const updated = await prisma.speakingSession.update({
    where: { id: session.id },
    data: {
      durationSeconds: input.durationSeconds,
      grammarNotes: parsed.grammar,
      fluencyNotes: parsed.fluency,
      vocabularyNotes: parsed.vocabulary,
      pronunciationNotes: parsed.pronunciation,
      focusArea: parsed.focusArea,
      completedAt: new Date(),
    },
  });

  await prisma.userProfile.update({
    where: { userId: user.id },
    data: {
      speakingMinutes: {
        increment: Math.max(1, Math.round(input.durationSeconds / 60)),
      },
    },
  });

  return updated;
}

function heuristicSpeakingNotes(transcript: string) {
  const pastIssue = /\byesterday\b/i.test(transcript) && /\bi go\b/i.test(transcript);
  return [
    `Grammar: ${pastIssue ? "Repeated tense errors detected (Past Simple)." : "Good overall; minor issues may remain."}`,
    "Fluency: Several pauses may appear when searching for words.",
    "Vocabulary: Appropriate for current level.",
    "Pronunciation: Record again if unclear words remain.",
    `Focus Area: ${pastIssue ? "Past-tense narration." : "Expand answers with reasons and examples."}`,
  ].join("\n");
}

function splitSpeakingNotes(notes: string, transcript: string) {
  const fallback = heuristicSpeakingNotes(transcript).split("\n");
  const pick = (label: string, fallbackLine: string) => {
    const line = notes
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.toLowerCase().startsWith(label.toLowerCase()));
    return line?.replace(/^[^:]+:\s*/i, "") || fallbackLine.replace(/^[^:]+:\s*/i, "");
  };
  return {
    grammar: pick("Grammar", fallback[0]!),
    fluency: pick("Fluency", fallback[1]!),
    vocabulary: pick("Vocabulary", fallback[2]!),
    pronunciation: pick("Pronunciation", fallback[3]!),
    focusArea: pick("Focus Area", fallback[4]!),
  };
}

export async function listSpeakingSessions(limit = 10) {
  const user = await requireDemoUser();
  return prisma.speakingSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
