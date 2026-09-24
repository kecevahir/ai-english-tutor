import type { AIProvider } from "@/services/ai/types";
import { createMockAIProvider } from "@/services/ai/mockProvider";
import { AIProviderError } from "@/services/ai/errors";

export function createAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

  if (provider === "mock" || provider === "") {
    return createMockAIProvider();
  }

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new AIProviderError(
        "MISSING_KEY",
        "AI_PROVIDER=openai but OPENAI_API_KEY is missing.",
      );
    }
    // Phase 2: implement OpenAI provider
    throw new AIProviderError(
      "PROVIDER",
      "OpenAI provider is not implemented yet (Phase 2). Use AI_PROVIDER=mock for Phase 1.",
    );
  }

  if (provider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new AIProviderError(
        "MISSING_KEY",
        "AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is missing.",
      );
    }
    throw new AIProviderError(
      "PROVIDER",
      "Anthropic provider is not implemented yet (Phase 2). Use AI_PROVIDER=mock for Phase 1.",
    );
  }

  throw new AIProviderError(
    "PROVIDER",
    `Unknown AI_PROVIDER "${provider}". Use mock | openai | anthropic.`,
  );
}
