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

## Next: Phase 5 — Grammar

1. Grammar topic list with mastery
2. Short drills per topic
3. Update GrammarProgress from exercise results
4. Feed weak topics into adaptive engine / lessons
