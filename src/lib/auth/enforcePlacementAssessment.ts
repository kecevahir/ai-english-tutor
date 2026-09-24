import { auth } from "@/auth";
import { prisma } from "@/lib/database/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * After login/register: unfinished placement must complete before other modules.
 */
export async function enforcePlacementAssessment() {
  const session = await auth();
  if (!session?.user?.id) return;

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { assessmentCompleted: true },
  });
  if (!profile) return;

  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  if (!profile.assessmentCompleted && pathname !== "/assessment") {
    redirect("/assessment");
  }
}
