# Implementation plan

## Completed

### Phase 1
- [x] Architecture, Next.js + Prisma foundation, dashboard, settings

### Phase 2 — AI Conversation
- [x] Conversation UI (modes + difficulty + custom scenario)
- [x] OpenAI + Anthropic providers (fail clearly without keys)
- [x] Mock provider for local practice without API keys
- [x] Persist Conversation / ConversationMessage
- [x] Loading + error states; English Only wired into system prompt

### Phase 3 — Mistake Analysis
- [x] End-of-conversation analysis (no mid-chat interruption)
- [x] Mistake rows + grammar progress touch + vocab extraction
- [x] Conversation Review UI + Review page recent mistakes

### Phase 4 — Vocabulary
- [x] Vocabulary page with status filters
- [x] Exercise types (translation, reverse, fill-blank, sentence)
- [x] SRS review session + ReviewHistory
- [x] Service/UI e2e scripts

### Phase 5 — Grammar
- [x] Grammar mastery list from DB
- [x] Weak-topic drills + GrammarProgress updates

### Phase 6 — Daily Lesson
- [x] Adaptive lesson generator from weak areas / due vocab / mistakes
- [x] Today's Lesson UI with regenerate + module links

### Phase 7 — Speech / Speaking
- [x] Web Speech STT/TTS client adapters
- [x] Speaking session UI + descriptive feedback persistence

### Phase 8 — Listening
- [x] Listening sessions with comprehension + transcript
- [x] Missed-item vocabulary capture

### Phase 9 — Progress
- [x] Range filters, skill cards, mistakes, weekly report

### Phase 10 — Level Assessment
- [x] Multi-section placement test saving CEFR profile/skills

## Ongoing
- Wire real OpenAI/Anthropic keys in production (`.env.local`)
- Expand pronunciation word-level scoring when STT confidence is available
- Chart visuals (optional recharts) on Progress
