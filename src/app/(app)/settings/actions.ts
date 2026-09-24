"use server";

import { revalidatePath } from "next/cache";
import {
  requireDemoUser,
  updateEnglishOnlyMode,
  updateThemePreference,
} from "@/lib/database/repositories/userRepository";

export async function setEnglishOnlyMode(enabled: boolean) {
  const user = await requireDemoUser();
  await updateEnglishOnlyMode(user.id, enabled);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function setThemePreference(theme: "LIGHT" | "DARK" | "SYSTEM") {
  const user = await requireDemoUser();
  await updateThemePreference(user.id, theme);
  revalidatePath("/settings");
}
