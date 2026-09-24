export class AIProviderError extends Error {
  readonly code: "TIMEOUT" | "MISSING_KEY" | "INVALID_RESPONSE" | "PROVIDER";

  constructor(
    code: AIProviderError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AIProviderError";
    this.code = code;
  }
}
