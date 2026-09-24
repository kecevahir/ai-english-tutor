"use client";

import type {
  SpeechRecognitionResult,
  SpeechToTextProvider,
  TextToSpeechOptions,
  TextToSpeechProvider,
} from "@/services/speech/types";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence: number };
  }>;
};

function getRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function createWebSpeechToTextProvider(): SpeechToTextProvider {
  let recognition: SpeechRecognitionLike | null = null;
  let resultHandler: ((result: SpeechRecognitionResult) => void) | null = null;
  let errorHandler: ((error: Error) => void) | null = null;

  return {
    name: "web-speech-stt",
    isSupported: () => Boolean(getRecognitionCtor()),
    async start(options) {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        throw new Error(
          "Speech-to-text is not supported in this browser. Use Chrome/Edge or type answers instead.",
        );
      }
      recognition = new Ctor();
      recognition.lang = options?.lang ?? "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        const result = event.results[event.resultIndex];
        if (!result) return;
        resultHandler?.({
          transcript: result[0].transcript,
          isFinal: result.isFinal,
          confidence: result[0].confidence,
        });
      };
      recognition.onerror = (event) => {
        errorHandler?.(new Error(`Speech recognition error: ${event.error}`));
      };
      recognition.start();
    },
    async stop() {
      recognition?.stop();
      recognition = null;
    },
    onResult(handler) {
      resultHandler = handler;
    },
    onError(handler) {
      errorHandler = handler;
    },
  };
}

export function createWebTextToSpeechProvider(): TextToSpeechProvider {
  return {
    name: "web-speech-tts",
    isSupported: () =>
      typeof window !== "undefined" && "speechSynthesis" in window,
    async speak(text: string, options?: TextToSpeechOptions) {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        throw new Error(
          "Text-to-speech is not supported in this browser.",
        );
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.lang ?? "en-US";
      utterance.rate = options?.rate ?? 1;
      utterance.pitch = options?.pitch ?? 1;
      await new Promise<void>((resolve, reject) => {
        utterance.onend = () => resolve();
        utterance.onerror = () =>
          reject(new Error("Text-to-speech playback failed."));
        window.speechSynthesis.speak(utterance);
      });
    },
    async stop() {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
  };
}
