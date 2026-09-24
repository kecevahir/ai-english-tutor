import {
  buildExercise,
  gradeVocabularyAnswer,
  listDueVocabulary,
} from "../src/services/vocabulary/vocabularyService";

async function main() {
  const due = await listDueVocabulary(3);
  console.log(
    "due",
    due.length,
    due.map((d) => d.vocabulary.word).join(","),
  );
  if (!due[0]) {
    throw new Error("no due words");
  }
  const exercise = buildExercise(due[0], "TRANSLATION");
  const result = await gradeVocabularyAnswer({
    progressId: exercise.progressId,
    type: "TRANSLATION",
    answer: due[0].vocabulary.translation ?? "x",
  });
  console.log(result.isCorrect, result.feedback, result.progress.status);
  console.log("VOCAB_E2E_OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
