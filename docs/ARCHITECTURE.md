# AI English Tutor — Technical Architecture

Target: `https://dmportal.com.tr/englishtutor` (`basePath: /englishtutor`)  
Auth: none in MVP (single local learner profile)  
Stack: Next.js App Router · TypeScript (strict) · Tailwind · PostgreSQL · Prisma · Zod

## 1. System overview

```text
Browser (UI + Web Speech)
        │
        ▼
Next.js App Router  ─── Server Actions / Route Handlers
        │
        ├── services/ai/*          (provider-agnostic LLM)
        ├── services/speech/*      (STT / TTS abstractions)
        ├── services/adaptiveLearning/*
        ├── lib/database/*         (Prisma repositories)
        └── lib/srs/*              (spaced repetition)
                │
                ▼
          PostgreSQL
```

Learning loop (required):

```text
USER PRACTICES → AI ANALYZES → MISTAKES/PERFORMANCE → DB
  → LEARNING PROFILE → ADAPTIVE ENGINE → NEXT LESSON → USER PRACTICES
```

## 2. Frontend

- App Router under `src/app/` with route group `(app)` for authenticated shell (no password; shell = main layout).
- Shared `AppSidebar` + `AppHeader`; pages stay thin; data via server components / services.
- Themes: light / dark via `next-themes` (`class` strategy).
- Responsive: desktop-first dashboard, usable on mobile (collapsible sidebar).

Routes:

| Path | Purpose | Phase |
|------|---------|-------|
| `/dashboard` | Level, streak, skills, weak/strong, recommendation | 1 |
| `/lesson` | Today's adaptive lesson | 6 |
| `/conversation` | Text (+ later voice) conversation | 2–3 |
| `/speaking` | Mic-first speaking sessions | 7 |
| `/listening` | Listening + comprehension | 8 |
| `/vocabulary` | Word bank + SRS exercises | 4 |
| `/grammar` | Topic mastery + drills | 5 |
| `/review` | Due reviews + conversation reviews | 3–4 |
| `/progress` | Charts + weekly report | 9 |
| `/settings` | English Only, theme, goals | 1 |

## 3. Database (Prisma)

Core entities (see `prisma/schema.prisma`):

- `User` / `UserProfile` — CEFR overall level, streak, goals, English Only, theme
- `SkillProgress` — speaking / listening / grammar / vocabulary / pronunciation / writing
- `GrammarTopic` + `GrammarProgress` — mastery per topic
- `Vocabulary` + `VocabularyProgress` — SRS fields
- `Conversation` + `ConversationMessage` — history
- `Mistake` — corrections with categories
- `Lesson` + `LessonActivity` — daily plans
- `ListeningSession` / `SpeakingSession` — modality sessions
- `ReviewHistory` — SRS / review events

Phase 1 seeds one demo learner so the dashboard is real (not mocked in the UI layer).

## 4. AI service architecture

```text
AIProvider (interface)
  generateResponse(input)
  analyzeConversation(input)
  generateLesson(input)
  evaluateAnswer(input)
  extractVocabulary(input)

implementations/
  openaiProvider.ts      (later)
  anthropicProvider.ts   (later)
  mockProvider.ts        (dev / missing keys)

createAIProvider() reads AI_PROVIDER + keys from env; never hardcode secrets.
Structured outputs validated with Zod schemas in `src/lib/ai/schemas/`.
Timeouts + typed errors in `src/services/ai/errors.ts`.
Prompts live in `src/prompts/` (tutor personality, analysis, lesson, grammar).
```

Phase 1: interface + mock provider + tutor system prompt only.

## 5. Speech architecture

```text
SpeechToTextProvider
  start() / stop() / onResult()

TextToSpeechProvider
  speak(text, options) / stop() / isSupported()

implementations/
  webSpeechStt.ts / webSpeechTts.ts
  (future: Deepgram, Whisper, ElevenLabs, etc.)
```

Browser APIs first; external services behind the same interfaces. Keys only via env.

## 6. Adaptive Learning Engine

File: `src/services/adaptiveLearning/adaptiveLearningEngine.ts`

| Function | Reads | Writes / returns |
|----------|-------|------------------|
| `getWeakAreas` | GrammarProgress, Mistake aggregates | ranked weak topics |
| `getStrongAreas` | GrammarProgress, vocab categories | ranked strengths |
| `calculateSkillLevels` | SkillProgress | CEFR-ish skill map |
| `selectGrammarTopics` | weak areas + last lessons | topics for next lesson |
| `selectVocabulary` | VocabularyProgress.nextReview | due words |
| `generateDailyPlan` | all of the above | Lesson draft |
| `calculateDifficulty` | user level + recent accuracy | Easy/Normal/Challenging |

Data flow:

```text
Mistake + GrammarProgress + VocabularyProgress + SkillProgress
        → adaptiveLearningEngine
        → Lesson (+ LessonActivity)
        → UI (Today's Lesson) / Conversation Difficulty
```

Phase 1 implements reading weak/strong/skills + a deterministic recommendation string for the dashboard (no LLM required).

## 7. npm packages

| Package | Role |
|---------|------|
| `next` `react` `react-dom` | App |
| `typescript` | Strict TS |
| `tailwindcss` | UI |
| `prisma` `@prisma/client` | ORM |
| `zod` | Validation |
| `next-themes` | Light/dark |
| `lucide-react` | Icons |
| `clsx` `tailwind-merge` | className helpers |
| `date-fns` | Dates |
| `tsx` `dotenv` | Seed / scripts |

Later phases: chart lib (`recharts`), optional speech SDKs.

## 8. Environment variables

See `.env.example`.

Required for Phase 1:

- `DATABASE_URL`

Optional (later phases; absence must surface clearly, never fake success):

- `AI_PROVIDER` (`mock` \| `openai` \| `anthropic`)
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`
- `AI_MODEL`
- `AI_TIMEOUT_MS`
- Speech provider keys when external STT/TTS is added

## 9. Implementation plan (phases)

1. **Foundation** — Next.js, Prisma, layout, sidebar, dashboard ← current
2. **AI Conversation** — text chat, history, DB
3. **Mistake Analysis** — corrections, review UI
4. **Vocabulary** — extraction, SRS, exercises
5. **Grammar** — topics, exercises, mastery
6. **Daily Lesson** — generator + UI
7. **Speech** — STT/TTS, speaking sessions
8. **Listening** — audio lessons + comprehension
9. **Progress** — analytics, weekly report
10. **Level Assessment** — placement test

Do not start the next phase until the current one builds, migrates, and runs cleanly.
