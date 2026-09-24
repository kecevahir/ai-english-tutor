import { AIProviderError } from "@/services/ai/errors";

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AIProviderError(
        "TIMEOUT",
        `AI request timed out after ${timeoutMs}ms.`,
        { cause: error },
      );
    }
    throw new AIProviderError("PROVIDER", "AI request failed.", { cause: error });
  } finally {
    clearTimeout(timer);
  }
}

export function getAITimeoutMs(): number {
  const raw = Number(process.env.AI_TIMEOUT_MS ?? "30000");
  return Number.isFinite(raw) && raw > 0 ? raw : 30_000;
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
    }
    throw new AIProviderError(
      "INVALID_RESPONSE",
      "AI returned non-JSON content where JSON was required.",
    );
  }
}
