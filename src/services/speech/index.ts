import type {
  SpeechToTextProvider,
  TextToSpeechProvider,
} from "@/services/speech/types";

/**
 * Browser Web Speech API adapters are client-only.
 * These factories return unsupported stubs on the server.
 */
export function createSpeechToTextProvider(): SpeechToTextProvider {
  return {
    name: "unsupported-server",
    isSupported: () => false,
    async start() {
      throw new Error("Speech-to-text is only available in the browser (Phase 7).");
    },
    async stop() {},
    onResult() {},
    onError() {},
  };
}

export function createTextToSpeechProvider(): TextToSpeechProvider {
  return {
    name: "unsupported-server",
    isSupported: () => false,
    async speak() {
      throw new Error("Text-to-speech is only available in the browser (Phase 7).");
    },
    async stop() {},
  };
}
