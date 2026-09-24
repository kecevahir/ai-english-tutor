export type {
  SpeechRecognitionResult,
  SpeechToTextProvider,
  TextToSpeechOptions,
  TextToSpeechProvider,
} from "@/services/speech/types";

/**
 * Server-safe stubs. Browser adapters live in `webSpeech.ts` and must be
 * imported only from Client Components.
 */
export function createSpeechToTextProvider() {
  return {
    name: "unsupported-server",
    isSupported: () => false,
    async start() {
      throw new Error("Speech-to-text is only available in the browser.");
    },
    async stop() {},
    onResult() {},
    onError() {},
  };
}

export function createTextToSpeechProvider() {
  return {
    name: "unsupported-server",
    isSupported: () => false,
    async speak() {
      throw new Error("Text-to-speech is only available in the browser.");
    },
    async stop() {},
  };
}
