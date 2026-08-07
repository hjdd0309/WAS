import type { Persona } from "../personas";

export default function IncomingCallScreen({
  persona,
  onAccept,
  onDecline,
}: {
  persona: Persona;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-800 to-black text-white flex flex-col items-center px-8 pt-24 pb-14">
      <p className="text-sm text-neutral-300">휴대전화</p>
      <div className="w-28 h-28 rounded-full bg-neutral-700 flex items-center justify-center text-5xl mt-8 mb-6 animate-pulse">
        📞
      </div>
      <h1 className="text-3xl font-semibold">{persona.name}</h1>
      <p className="text-neutral-400 mt-1">휴대전화</p>

      <div className="flex-1" />

      <div className="flex items-center justify-between w-full px-4">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onDecline}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-2xl"
            aria-label="거절"
          >
            ✕
          </button>
          <span className="text-xs text-neutral-400">거절</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-2xl animate-bounce"
            aria-label="받기"
          >
            📞
          </button>
          <span className="text-xs text-neutral-400">받기</span>
        </div>
      </div>
    </div>
  );
}
