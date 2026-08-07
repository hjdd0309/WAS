import { useCallback, useEffect, useRef, useState } from "react";

export function useTts() {
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const elevenLabsAvailableRef = useRef(true);

  useEffect(() => {
    const pickVoice = () => {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      const koVoices = voices.filter((v) => v.lang?.startsWith("ko"));
      voiceRef.current =
        koVoices.find((v) => /google/i.test(v.name)) ??
        koVoices[0] ??
        voices[0] ??
        null;
    };
    pickVoice();
    window.speechSynthesis?.addEventListener("voiceschanged", pickVoice);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", pickVoice);
  }, []);

  const speakBrowserTts = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        resolve();
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const speakElevenLabs = useCallback((text: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) {
          reject(new Error(`tts proxy ${res.status}`));
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplay = () => setSpeaking(true);
        audio.onended = () => {
          setSpeaking(false);
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          setSpeaking(false);
          URL.revokeObjectURL(url);
          reject(new Error("audio playback error"));
        };
        await audio.play();
      } catch (err) {
        reject(err instanceof Error ? err : new Error("tts request failed"));
      }
    });
  }, []);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (elevenLabsAvailableRef.current) {
        try {
          await speakElevenLabs(text);
          return;
        } catch {
          elevenLabsAvailableRef.current = false;
        }
      }
      await speakBrowserTts(text);
    },
    [speakElevenLabs, speakBrowserTts],
  );

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  return { speak, cancel, speaking };
}
