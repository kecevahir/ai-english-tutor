import {
  startSpeakingSession,
  submitSpeakingAnswer,
} from "../src/services/speaking/speakingService";
import {
  createListeningSession,
  completeListeningSession,
} from "../src/services/listening/listeningService";
import { submitAssessment } from "../src/services/assessment/assessmentService";
import { getProgressOverview, buildWeeklyReport } from "../src/services/progress/progressService";

async function main() {
  const speaking = await startSpeakingSession();
  const speakingResult = await submitSpeakingAnswer({
    sessionId: speaking.id,
    transcript: "Yesterday I go to the park and I meet my friend.",
    durationSeconds: 42,
  });
  console.log("speaking focus", speakingResult.focusArea);

  const listening = await createListeningSession();
  const listeningResult = await completeListeningSession({
    sessionId: listening.session.id,
    questions: listening.questions,
    answers: listening.questions.map((q) => q.correctIndex),
  });
  console.log("listening score", listeningResult.score);

  const assessment = await submitAssessment({
    v1: 1,
    g1: 1,
    g2: 2,
    r1: 1,
    w1: "I usually start work at nine and finish at six. I have meetings in the afternoon.",
    s1: "Last weekend I visited my family and cooked dinner together.",
  });
  console.log("assessment", assessment.overallLevel);

  const progress = await getProgressOverview("30d");
  const weekly = await buildWeeklyReport();
  console.log(
    "progress skills",
    progress.skills.length,
    "weekly",
    weekly.mainImprovement,
  );
  console.log("PHASE7_10_E2E_OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
