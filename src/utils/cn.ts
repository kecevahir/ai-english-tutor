import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CefrLevel } from "@prisma/client";
import type { CefrLevelCode } from "@/types/learning";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const CEFR_FROM_DB: Record<CefrLevel, CefrLevelCode> = {
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B1_PLUS: "B1+",
  B2: "B2",
  B2_PLUS: "B2+",
  C1: "C1",
  C2: "C2",
};

export function cefrToDisplay(level: CefrLevel): CefrLevelCode {
  return CEFR_FROM_DB[level];
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
