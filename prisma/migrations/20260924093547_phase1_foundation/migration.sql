-- CreateEnum
CREATE TYPE "CefrLevel" AS ENUM ('A1', 'A2', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "SkillType" AS ENUM ('SPEAKING', 'LISTENING', 'GRAMMAR', 'VOCABULARY', 'PRONUNCIATION', 'WRITING');

-- CreateEnum
CREATE TYPE "ConversationMode" AS ENUM ('FREE', 'DAILY_LIFE', 'TRAVEL', 'BUSINESS', 'RESTAURANT', 'HOTEL', 'AIRPORT', 'SHOPPING', 'PHONE_CALL', 'MEETING', 'JOB_INTERVIEW', 'DEBATE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ConversationDifficulty" AS ENUM ('EASY', 'NORMAL', 'CHALLENGING', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MistakeCategory" AS ENUM ('GRAMMAR', 'VOCABULARY', 'WORD_CHOICE', 'WORD_ORDER', 'PREPOSITION', 'ARTICLE', 'TENSE', 'PRONUNCIATION', 'SPELLING', 'NATURAL_EXPRESSION');

-- CreateEnum
CREATE TYPE "VocabularyStatus" AS ENUM ('NEW', 'LEARNING', 'FAMILIAR', 'MASTERED');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "LessonActivityType" AS ENUM ('VOCABULARY_REVIEW', 'GRAMMAR', 'SPEAKING', 'LISTENING', 'CONVERSATION', 'WRITING', 'PRONUNCIATION');

-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallLevel" "CefrLevel" NOT NULL DEFAULT 'B1',
    "englishOnlyMode" BOOLEAN NOT NULL DEFAULT false,
    "theme" "ThemePreference" NOT NULL DEFAULT 'SYSTEM',
    "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 25,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStudyDate" TIMESTAMP(3),
    "assessmentCompleted" BOOLEAN NOT NULL DEFAULT false,
    "wordsLearnedCount" INTEGER NOT NULL DEFAULT 0,
    "conversationsCount" INTEGER NOT NULL DEFAULT 0,
    "speakingMinutes" INTEGER NOT NULL DEFAULT 0,
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skill" "SkillType" NOT NULL,
    "level" "CefrLevel" NOT NULL DEFAULT 'B1',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastPracticed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarTopic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cefrBand" "CefrLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrammarTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "mistakes" INTEGER NOT NULL DEFAULT 0,
    "masteryLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastPracticed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrammarProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT,
    "definition" TEXT,
    "exampleSentence" TEXT,
    "level" "CefrLevel",
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "status" "VocabularyStatus" NOT NULL DEFAULT 'NEW',
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewed" TIMESTAMP(3),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nextReview" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "ConversationMode" NOT NULL DEFAULT 'FREE',
    "difficulty" "ConversationDifficulty" NOT NULL DEFAULT 'ADAPTIVE',
    "customPrompt" TEXT,
    "title" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mistake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "grammarTopicId" TEXT,
    "originalSentence" TEXT NOT NULL,
    "correctedSentence" TEXT NOT NULL,
    "explanation" TEXT,
    "category" "MistakeCategory" NOT NULL,
    "subCategory" TEXT,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "mastered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mistake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 25,
    "status" "LessonStatus" NOT NULL DEFAULT 'PLANNED',
    "recommendation" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonActivity" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" "LessonActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 5,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListeningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" "CefrLevel" NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "transcript" TEXT,
    "audioUrl" TEXT,
    "score" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListeningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "grammarNotes" TEXT,
    "fluencyNotes" TEXT,
    "vocabularyNotes" TEXT,
    "pronunciationNotes" TEXT,
    "focusArea" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeakingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "wasCorrect" BOOLEAN NOT NULL,
    "responseMeta" JSONB,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "SkillProgress_userId_idx" ON "SkillProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillProgress_userId_skill_key" ON "SkillProgress"("userId", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "GrammarTopic_slug_key" ON "GrammarTopic"("slug");

-- CreateIndex
CREATE INDEX "GrammarProgress_userId_masteryLevel_idx" ON "GrammarProgress"("userId", "masteryLevel");

-- CreateIndex
CREATE UNIQUE INDEX "GrammarProgress_userId_topicId_key" ON "GrammarProgress"("userId", "topicId");

-- CreateIndex
CREATE INDEX "Vocabulary_word_idx" ON "Vocabulary"("word");

-- CreateIndex
CREATE UNIQUE INDEX "Vocabulary_word_category_key" ON "Vocabulary"("word", "category");

-- CreateIndex
CREATE INDEX "VocabularyProgress_userId_nextReview_idx" ON "VocabularyProgress"("userId", "nextReview");

-- CreateIndex
CREATE INDEX "VocabularyProgress_userId_status_idx" ON "VocabularyProgress"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyProgress_userId_vocabularyId_key" ON "VocabularyProgress"("userId", "vocabularyId");

-- CreateIndex
CREATE INDEX "Conversation_userId_startedAt_idx" ON "Conversation"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversationId_createdAt_idx" ON "ConversationMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Mistake_userId_category_createdAt_idx" ON "Mistake"("userId", "category", "createdAt");

-- CreateIndex
CREATE INDEX "Mistake_userId_mastered_idx" ON "Mistake"("userId", "mastered");

-- CreateIndex
CREATE INDEX "Lesson_userId_scheduledFor_idx" ON "Lesson"("userId", "scheduledFor");

-- CreateIndex
CREATE INDEX "LessonActivity_lessonId_sortOrder_idx" ON "LessonActivity"("lessonId", "sortOrder");

-- CreateIndex
CREATE INDEX "ListeningSession_userId_createdAt_idx" ON "ListeningSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SpeakingSession_userId_createdAt_idx" ON "SpeakingSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewHistory_userId_reviewedAt_idx" ON "ReviewHistory"("userId", "reviewedAt");

-- CreateIndex
CREATE INDEX "ReviewHistory_itemType_itemId_idx" ON "ReviewHistory"("itemType", "itemId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillProgress" ADD CONSTRAINT "SkillProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarProgress" ADD CONSTRAINT "GrammarProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarProgress" ADD CONSTRAINT "GrammarProgress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "GrammarTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyProgress" ADD CONSTRAINT "VocabularyProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyProgress" ADD CONSTRAINT "VocabularyProgress_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_grammarTopicId_fkey" FOREIGN KEY ("grammarTopicId") REFERENCES "GrammarTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonActivity" ADD CONSTRAINT "LessonActivity_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListeningSession" ADD CONSTRAINT "ListeningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingSession" ADD CONSTRAINT "SpeakingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHistory" ADD CONSTRAINT "ReviewHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
