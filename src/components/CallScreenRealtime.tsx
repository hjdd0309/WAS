import { useEffect, useState } from "react";
import type { Persona } from "../personas";
import type { useRealtimeCall } from "../useRealtimeCall";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CallScreenRealtime({
  persona,
  call,
  onEnd,
}: {
  persona: Persona;
  call: ReturnType<typeof useRealtimeCall>;
  onEnd: () => void;
}) {
  const { status, transcript, aiSpeaking, hangup } = call;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "connected") return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const handleHangup = () => {
    hangup();
    onEnd();
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-indigo-950 via-neutral-900 to-black text-white flex flex-col px-6 pt-16 pb-10">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-neutral-700 flex items-center justify-center text-4xl mb-4">
          {persona.emoji}
        </div>
        <h1 className="text-2xl font-semibold">{persona.name}</h1>
        <p className="text-neutral-400 text-sm mt-1">
          {status === "connecting" && "연결 중..."}
          {status === "connected" && formatTime(elapsed)}
          {status === "error" && "연결에 실패했어요"}
        </p>
      </div>

      <div className="flex items-end justify-center gap-1 h-10 my-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className={`w-1.5 rounded-full bg-purple-400 transition-all duration-150 ${
              aiSpeaking ? "animate-[pulse_0.6s_ease-in-out_infinite]" : ""
            }`}
            style={{
              height: aiSpeaking ? `${8 + ((i * 37) % 28)}px` : "6px",
              animationDelay: `${i * 70}ms`,
              opacity: aiSpeaking ? 1 : 0.35,
            }}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 px-1">
        {transcript.map((line, i) => (
          <div
            key={i}
            className={`rounded-2xl px-4 py-2.5 text-sm max-w-[85%] animate-[fadeIn_0.3s_ease] ${
              line.speaker === "user"
                ? "bg-purple-600/70 rounded-tr-sm ml-auto"
                : "bg-white/10 backdrop-blur rounded-tl-sm"
            }`}
          >
            {line.text}
          </div>
        ))}
        {status === "connecting" && (
          <p className="text-neutral-500 text-xs text-center pt-6">
            마이크 연결을 기다리는 중...
          </p>
        )}
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={handleHangup}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-2xl"
          aria-label="통화 종료"
          style={{ transform: "rotate(135deg)" }}
        >
          📞
        </button>
      </div>
    </div>
  );
}
