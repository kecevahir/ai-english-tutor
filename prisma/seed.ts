import { PrismaClient, CefrLevel, SkillType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const GRAMMAR_TOPICS: Array<{ slug: string; name: string; cefrBand: CefrLevel }> = [
  { slug: "present-simple", name: "Present Simple", cefrBand: CefrLevel.A1 },
  { slug: "present-continuous", name: "Present Continuous", cefrBand: CefrLevel.A1 },
  { slug: "past-simple", name: "Past Simple", cefrBand: CefrLevel.A2 },
  { slug: "past-continuous", name: "Past Continuous", cefrBand: CefrLevel.A2 },
  { slug: "present-perfect", name: "Present Perfect", cefrBand: CefrLevel.B1 },
  { slug: "past-perfect", name: "Past Perfect", cefrBand: CefrLevel.B2 },
  { slug: "future-forms", name: "Future Forms", cefrBand: CefrLevel.B1 },
  { slug: "conditionals", name: "Conditionals", cefrBand: CefrLevel.B1 },
  { slug: "passive-voice", name: "Passive Voice", cefrBand: CefrLevel.B1 },
  { slug: "reported-speech", name: "Reported Speech", cefrBand: CefrLevel.B2 },
  { slug: "modal-verbs", name: "Modal Verbs", cefrBand: CefrLevel.B1 },
  { slug: "articles", name: "Articles", cefrBand: CefrLevel.A2 },
  { slug: "prepositions", name: "Prepositions", cefrBand: CefrLevel.A2 },
  { slug: "relative-clauses", name: "Relative Clauses", cefrBand: CefrLevel.B1 },
  { slug: "gerunds-infinitives", name: "Gerunds / Infinitives", cefrBand: CefrLevel.B1 },
  { slug: "daily-conversation", name: "Daily Conversation", cefrBand: CefrLevel.B1 },
  { slug: "travel-vocabulary", name: "Travel Vocabulary", cefrBand: CefrLevel.A2 },
  { slug: "numbers-dates", name: "Numbers & Dates", cefrBand: CefrLevel.A1 },
];

/**
 * Idempotent seed — never wipes learner data.
 * Shared grammar catalog + optional demo account for local/dev.
 */
async function main() {
  for (const topic of GRAMMAR_TOPICS) {
    await prisma.grammarTopic.upsert({
      where: { slug: topic.slug },
      create: topic,
      update: { name: topic.name, cefrBand: topic.cefrBand },
    });
  }

  const demoUsername = process.env.SEED_DEMO_USERNAME || "demo";
  const demoPassword = process.env.SEED_DEMO_PASSWORD || "demo1234";
  const existing = await prisma.user.findUnique({ where: { username: demoUsername } });

  if (!existing) {
    const passwordHash = await bcrypt.hash(demoPassword, 10);
    await prisma.user.create({
      data: {
        username: demoUsername,
        passwordHash,
        email: "learner@local.dev",
        displayName: "Demo Learner",
        profile: {
          create: {
            overallLevel: CefrLevel.B1_PLUS,
            dailyGoalMinutes: 25,
            currentStreak: 0,
            longestStreak: 0,
            assessmentCompleted: false,
            wordsLearnedCount: 0,
            conversationsCount: 0,
            speakingMinutes: 0,
            lessonsCompleted: 0,
            englishOnlyMode: false,
            theme: "SYSTEM",
          },
        },
        skillProgress: {
          create: Object.values(SkillType).map((skill) => ({
            skill,
            level: CefrLevel.B1,
            score: 50,
          })),
        },
      },
    });
    console.log(`Seeded demo user: ${demoUsername} / ${demoPassword}`);
  } else {
    console.log(`Demo user already exists: ${demoUsername}`);
  }

  console.log("Seed complete (grammar topics upserted).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
