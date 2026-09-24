import {
  getGrammarDrills,
  gradeGrammarDrill,
} from "../src/services/grammar/grammarService";

async function main() {
  const drills = await getGrammarDrills(3);
  console.log(
    "drills",
    drills.map((d) => d.topicName).join(", "),
  );
  if (!drills[0]) throw new Error("no drills");
  const wrong = await gradeGrammarDrill({
    progressId: drills[0].progressId,
    answer: "totally wrong",
    expected: drills[0].expected,
    explanation: drills[0].explanation,
  });
  console.log("wrong", wrong.isCorrect, wrong.masteryLevel);
  const right = await gradeGrammarDrill({
    progressId: drills[0].progressId,
    answer: drills[0].expected,
    expected: drills[0].expected,
    explanation: drills[0].explanation,
  });
  console.log("right", right.isCorrect, right.masteryLevel);
  console.log("GRAMMAR_E2E_OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
