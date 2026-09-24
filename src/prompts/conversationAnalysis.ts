export const CONVERSATION_ANALYSIS_PROMPT = `Analyze the learner's English messages.

Return structured JSON only with:
- correctedSentences: original, corrected, explanation, category, subCategory
- extractedVocabulary: useful words/phrases with optional translation and definition
- notes: brief tutor notes

Do not invent mistakes. Prefer precision over volume.
Categories: Grammar, Vocabulary, Word Choice, Word Order, Preposition, Article, Tense, Pronunciation, Spelling, Natural Expression.`;
