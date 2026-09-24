import { generateTodaysLesson } from "../src/services/lesson/lessonService";

async function main() {
  const lesson = await generateTodaysLesson();
  console.log(
    lesson.title,
    lesson.activities.length,
    lesson.recommendation?.slice(0, 120),
  );
  if (lesson.activities.length < 1) {
    throw new Error("lesson has no activities");
  }
  console.log("LESSON_E2E_OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
