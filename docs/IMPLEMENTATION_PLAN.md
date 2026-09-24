# Implementation plan

## Completed in Phase 1

- [x] Architecture document
- [x] Next.js + TS + Tailwind with `basePath: /englishtutor`
- [x] Full Prisma schema for planned entities
- [x] Migration + demo seed
- [x] Sidebar shell + all primary routes
- [x] Dashboard from DB (stats, skills, weak/strong, recommendation)
- [x] Today's Lesson read-only view from seeded plan
- [x] Settings: English Only Mode toggle (persisted)
- [x] AI / Speech / Adaptive Learning stubs + prompts
- [x] `.env.example` + README

## Next: Phase 2 — AI Conversation

1. Conversation UI (modes + difficulty)
2. `createAIProvider()` real OpenAI/Anthropic adapters
3. Persist `Conversation` / `ConversationMessage`
4. Streaming responses + loading/error states
5. Keep English Only Mode wired into system prompt

Gate: Phase 1 must build, migrate, and run before Phase 2 code lands.
