"use server";

import {
  buildWeeklyReport,
  getProgressOverview,
  type ProgressRange,
} from "@/services/progress/progressService";

export async function fetchProgressAction(range: ProgressRange = "30d") {
  const [overview, weekly] = await Promise.all([
    getProgressOverview(range),
    buildWeeklyReport(),
  ]);
  return { overview, weekly };
}
