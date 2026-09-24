import type { AIProvider } from "@/services/ai/types";
import { createMockAIProvider } from "@/services/ai/mockProvider";
import { createOpenAIProvider } from "@/services/ai/openaiProvider";
import { createAnthropicProvider } from "@/services/ai/anthropicProvider";
import { AIProviderError } from "@/services/ai/errors";

export function createAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

  if (provider === "mock" || provider === "") {
    return createMockAIProvider();
  }

  if (provider === "openai") {
    return createOpenAIProvider();
  }

  if (provider === "anthropic") {
    return createAnthropicProvider();
  }

  throw new AIProviderError(
    "PROVIDER",
    `Unknown AI_PROVIDER "${provider}". Use mock | openai | anthropic.`,
  );
}

export function getConfiguredAIProviderName(): string {
  return (process.env.AI_PROVIDER ?? "mock").toLowerCase() || "mock";
}
