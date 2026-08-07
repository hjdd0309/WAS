import { useEffect, useRef, useState } from "react";
import type { CallLine } from "../types";
import type { Persona } from "../personas";
import { useTts } from "../useTts";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CallScreenScripted({
  persona,
  lines,
  onEnd,
}: {
  persona: Persona;
  lines: CallLine[];
  onEnd: () => void;
}) {
  const { speak, cancel, speaking } = useTts();
  const [elapsed, setElapsed] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const endedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      for (let i = 0; i < lines.length; i++) {
        if (cancelled) return;
        setVisibleCount(i + 1);
        await speak(lines[i].text);
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 450));
      }
      if (!cancelled && !endedRef.current) {
        endedRef.current = true;
        setTimeout(() => {
          if (!cancelled) onEnd();
        }, 900);
      }
    }
    run();

    return () => {
      cancelled = true;
      cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHangup = () => {
    endedRef.current = true;
    cancel();
    onEnd();
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-indigo-950 via-neutral-900 to-black text-white flex flex-col px-6 pt-16 pb-10">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-neutral-700 flex items-center justify-center text-4xl mb-4">
          {persona.emoji}
        </div>
        <h1 className="text-2xl font-semibold">{persona.name}</h1>
        <p className="text-neutral-400 text-sm mt-1">{formatTime(elapsed)}</p>
      </div>

      <div className="flex items-end justify-center gap-1 h-10 my-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className={`w-1.5 rounded-full bg-purple-400 transition-all duration-150 ${
              speaking ? "animate-[pulse_0.6s_ease-in-out_infinite]" : ""
            }`}
            style={{
              height: speaking ? `${8 + ((i * 37) % 28)}px` : "6px",
              animationDelay: `${i * 70}ms`,
              opacity: speaking ? 1 : 0.35,
            }}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 px-1">
        {lines.slice(0, visibleCount).map((line, i) => (
          <div
            key={i}
            className="bg-white/10 backdrop-blur rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[85%] animate-[fadeIn_0.3s_ease]"
          >
            {line.text}
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={handleHangup}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-2xl rotate-135"
          aria-label="통화 종료"
          style={{ transform: "rotate(135deg)" }}
        >
          📞
        </button>
      </div>
    </div>
  );
}
