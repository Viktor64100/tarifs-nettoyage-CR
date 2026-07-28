"use client";
import { useCallback, useRef, useState } from "react";

// Typage minimal de la Web Speech API (absente des libs TS standard).
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Micro refusé — autorise l'accès au micro dans les réglages du navigateur.",
  "service-not-allowed": "Micro refusé — autorise l'accès au micro dans les réglages du navigateur.",
  "no-speech": "Aucune voix détectée, réessaie.",
  network: "Connexion réseau nécessaire pour la dictée.",
  aborted: "",
};

// Dictée navigateur (gratuite, sans appel serveur). Non supportée par tous
// les navigateurs (ex. Firefox) — `supported` permet de masquer l'option.
export function useSpeechRecognition() {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported] = useState(() => getCtor() !== null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const start = useCallback((onTranscript: (text: string) => void) => {
    const Ctor = getCtor();
    if (!Ctor) return;
    setError(null);
    const recognition = new Ctor();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0]?.transcript ?? "";
      }
      onTranscript(text.trim());
    };
    recognition.onerror = (event) => {
      setListening(false);
      const message = ERROR_MESSAGES[event.error];
      if (message) setError(message);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, error, start, stop };
}
