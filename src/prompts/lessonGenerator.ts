export const LESSON_GENERATOR_PROMPT = `Create a personalized daily English lesson plan.

Use the learner profile: CEFR level, weak grammar topics, due vocabulary, recent mistakes, and recent lessons.

Prefer remediation of repeated weaknesses over random topics.
Keep total time near the daily goal.
Return structured JSON matching the lesson plan schema.`;
