export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export interface SpeechToTextProvider {
  readonly name: string;
  isSupported(): boolean;
  start(options?: {
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
  }): Promise<void>;
  stop(): Promise<void>;
  onResult(handler: (result: SpeechRecognitionResult) => void): void;
  onError(handler: (error: Error) => void): void;
}

export interface TextToSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  voiceHint?: string;
}

export interface TextToSpeechProvider {
  readonly name: string;
  isSupported(): boolean;
  speak(text: string, options?: TextToSpeechOptions): Promise<void>;
  stop(): Promise<void>;
}
