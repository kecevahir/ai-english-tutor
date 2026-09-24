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

## Next: Phase 4 — Vocabulary

1. Vocabulary page with status filters
2. Exercise types (translation, reverse, fill-blank, sentence)
3. SRS review session UI
4. Wire adaptive engine `selectVocabulary` into daily lesson
