import { useCallback, useRef, useState } from "react";
import type { CallLine, OnboardingData } from "./types";

export type RealtimeStatus =
  | "idle"
  | "checking"
  | "unavailable"
  | "connecting"
  | "connected"
  | "ended"
  | "error";

interface RealtimeEvent {
  type: string;
  delta?: string;
  transcript?: string;
}

export function useRealtimeCall(onboarding: OnboardingData) {
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [transcript, setTranscript] = useState<CallLine[]>([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const currentAiIndexRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  const handleEvent = useCallback((event: RealtimeEvent) => {
    switch (event.type) {
      case "response.audio_transcript.delta": {
        setAiSpeaking(true);
        setTranscript((prev) => {
          const next = [...prev];
          const idx = currentAiIndexRef.current;
          if (idx === null || next[idx]?.done) {
            next.push({ speaker: "ai", text: event.delta ?? "", done: false });
            currentAiIndexRef.current = next.length - 1;
          } else {
            next[idx] = { ...next[idx], text: next[idx].text + (event.delta ?? "") };
          }
          return next;
        });
        break;
      }
      case "response.audio_transcript.done": {
        setAiSpeaking(false);
        setTranscript((prev) => {
          const next = [...prev];
          const idx = currentAiIndexRef.current;
          if (idx !== null && next[idx]) next[idx] = { ...next[idx], done: true };
          return next;
        });
        currentAiIndexRef.current = null;
        break;
      }
      case "conversation.item.input_audio_transcription.completed": {
        if (event.transcript?.trim()) {
          setTranscript((prev) => [
            ...prev,
            { speaker: "user", text: event.transcript ?? "", done: true },
          ]);
        }
        break;
      }
      case "input_audio_buffer.speech_started": {
        setAiSpeaking(false);
        break;
      }
      default:
        break;
    }
  }, []);

  const hangup = useCallback(() => {
    dcRef.current?.close();
    dcRef.current = null;
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }
    setAiSpeaking(false);
    setStatus((s) => (s === "unavailable" ? s : "ended"));
  }, []);

  const connect = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus("checking");

    try {
      const sessionRes = await fetch("/api/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: onboarding.interests,
          plan: onboarding.plan,
          personaId: onboarding.personaId,
        }),
      });

      if (!sessionRes.ok) {
        setStatus("unavailable");
        return;
      }

      const { client_secret: clientSecret } = await sessionRes.json();
      if (!clientSecret) {
        setStatus("unavailable");
        return;
      }

      setStatus("connecting");

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioElRef.current = audioEl;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => {
        try {
          handleEvent(JSON.parse(e.data));
        } catch {
          // ignore malformed events
        }
      };
      dc.onopen = () => {
        setStatus("connected");
        // Kick off the call with the AI speaking first, instead of waiting for the user.
        dc.send(JSON.stringify({ type: "response.create" }));
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(`https://api.openai.com/v1/realtime/calls`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpRes.ok) throw new Error("realtime sdp exchange failed");

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err) {
      console.error("realtime call failed", err);
      hangup();
      setStatus("error");
    }
  }, [onboarding, handleEvent, hangup]);

  return { status, transcript, aiSpeaking, connect, hangup };
}
