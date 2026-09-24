import { PrismaClient, CefrLevel, SkillType, LessonStatus, LessonActivityType } from "@prisma/client";

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

const MASTERY: Record<string, number> = {
  "present-perfect": 52,
  prepositions: 58,
  "past-simple": 64,
  articles: 67,
  "present-continuous": 72,
  conditionals: 70,
  "modal-verbs": 74,
  "future-forms": 76,
  "daily-conversation": 91,
  "travel-vocabulary": 88,
  "numbers-dates": 90,
  "present-simple": 86,
};

async function main() {
  await prisma.reviewHistory.deleteMany();
  await prisma.lessonActivity.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.mistake.deleteMany();
  await prisma.conversationMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.listeningSession.deleteMany();
  await prisma.speakingSession.deleteMany();
  await prisma.vocabularyProgress.deleteMany();
  await prisma.vocabulary.deleteMany();
  await prisma.grammarProgress.deleteMany();
  await prisma.grammarTopic.deleteMany();
  await prisma.skillProgress.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  for (const topic of GRAMMAR_TOPICS) {
    await prisma.grammarTopic.create({ data: topic });
  }

  const user = await prisma.user.create({
    data: {
      email: "learner@local.dev",
      displayName: "Learner",
      profile: {
        create: {
          overallLevel: CefrLevel.B1_PLUS,
          dailyGoalMinutes: 25,
          currentStreak: 7,
          longestStreak: 12,
          lastStudyDate: new Date(),
          assessmentCompleted: true,
          wordsLearnedCount: 482,
          conversationsCount: 37,
          speakingMinutes: 145,
          lessonsCompleted: 18,
          englishOnlyMode: false,
          theme: "SYSTEM",
        },
      },
      skillProgress: {
        create: [
          { skill: SkillType.SPEAKING, level: CefrLevel.B1, score: 62 },
          { skill: SkillType.LISTENING, level: CefrLevel.B2, score: 74 },
          { skill: SkillType.GRAMMAR, level: CefrLevel.B1, score: 58 },
          { skill: SkillType.VOCABULARY, level: CefrLevel.B1_PLUS, score: 68 },
          { skill: SkillType.PRONUNCIATION, level: CefrLevel.B1, score: 60 },
          { skill: SkillType.WRITING, level: CefrLevel.B1_PLUS, score: 65 },
        ],
      },
    },
  });

  const topics = await prisma.grammarTopic.findMany();
  for (const topic of topics) {
    const mastery = MASTERY[topic.slug] ?? 75;
    const attempts = 20 + Math.round((100 - mastery) / 2);
    const correct = Math.round((mastery / 100) * attempts);
    await prisma.grammarProgress.create({
      data: {
        userId: user.id,
        topicId: topic.id,
        masteryLevel: mastery,
        score: mastery,
        attempts,
        correctAnswers: correct,
        mistakes: Math.max(attempts - correct, 0),
        lastPracticed: new Date(),
      },
    });
  }

  const sampleWords = [
    { word: "appointment", translation: "randevu", category: "Daily Life" },
    { word: "deadline", translation: "son teslim tarihi", category: "Business" },
    { word: "luggage", translation: "bagaj", category: "Travel" },
    { word: "receipt", translation: "fiş / makbuz", category: "Shopping" },
    { word: "negotiate", translation: "pazarlık etmek", category: "Business" },
    { word: "commute", translation: "işe gidip gelmek", category: "Daily Life" },
    { word: "itinerary", translation: "seyahat programı", category: "Travel" },
    { word: "reliable", translation: "güvenilir", category: "General" },
  ];

  for (const item of sampleWords) {
    const vocab = await prisma.vocabulary.create({
      data: {
        word: item.word,
        translation: item.translation,
        category: item.category,
        level: CefrLevel.B1,
        definition: item.word,
        exampleSentence: `I need to practice the word "${item.word}".`,
      },
    });
    await prisma.vocabularyProgress.create({
      data: {
        userId: user.id,
        vocabularyId: vocab.id,
        status: "LEARNING",
        nextReview: new Date(),
        reviewCount: 1,
      },
    });
  }

  const presentPerfect = topics.find((t) => t.slug === "present-perfect");
  if (presentPerfect) {
    await prisma.mistake.create({
      data: {
        userId: user.id,
        grammarTopicId: presentPerfect.id,
        originalSentence: "Yesterday I go to my office and I meet my customer.",
        correctedSentence: "Yesterday I went to my office and met my client.",
        explanation: "Use Past Simple for finished actions at a specific time in the past.",
        category: "TENSE",
        subCategory: "Past Simple / Irregular Verbs",
        severity: 2,
      },
    });
  }

  const today = new Date();
  today.setHours(9, 0, 0, 0);

  await prisma.lesson.create({
    data: {
      userId: user.id,
      title: "Today's Lesson",
      estimatedMinutes: 25,
      status: LessonStatus.PLANNED,
      scheduledFor: today,
      recommendation:
        "You have been struggling with Present Perfect.\nToday's lesson will focus on Present Perfect, Past Simple vs Present Perfect, conversation practice, and vocabulary reviews.",
      activities: {
        create: [
          {
            type: LessonActivityType.VOCABULARY_REVIEW,
            title: "Vocabulary Review",
            description: "8 words due",
            estimatedMinutes: 5,
            sortOrder: 1,
          },
          {
            type: LessonActivityType.GRAMMAR,
            title: "Present Perfect",
            description: "Past Simple vs Present Perfect",
            estimatedMinutes: 7,
            sortOrder: 2,
          },
          {
            type: LessonActivityType.SPEAKING,
            title: "Speaking",
            description: "What have you done this week?",
            estimatedMinutes: 8,
            sortOrder: 3,
          },
          {
            type: LessonActivityType.LISTENING,
            title: "Listening",
            description: "B1 short conversation",
            estimatedMinutes: 5,
            sortOrder: 4,
          },
        ],
      },
    },
  });

  console.log("Seeded demo learner:", user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
