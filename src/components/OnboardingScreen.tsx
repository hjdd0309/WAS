import { useState } from "react";
import type { OnboardingData } from "../types";
import { DEFAULT_PERSONA_ID, PERSONAS } from "../personas";

export default function OnboardingScreen({
  onComplete,
}: {
  onComplete: (data: OnboardingData) => void;
}) {
  const [interest1, setInterest1] = useState("");
  const [interest2, setInterest2] = useState("");
  const [plan, setPlan] = useState("");
  const [personaId, setPersonaId] = useState(DEFAULT_PERSONA_ID);

  const canSubmit = interest1.trim().length > 0 && plan.trim().length > 0;

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-900 to-black text-white flex flex-col px-6 pt-16 pb-8 overflow-y-auto">
      <h1 className="text-2xl font-semibold mb-2">여보세요</h1>
      <p className="text-sm text-neutral-400 mb-8">
        시작하기 전에, 몇 가지만 알려주세요.
      </p>

      <div className="space-y-5">
        <div>
          <label className="text-sm text-neutral-300 mb-1 block">
            요즘 관심 있는 것 (1개 이상)
          </label>
          <input
            className="w-full bg-neutral-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="예: 러닝, 야구, 자격증 공부"
            value={interest1}
            onChange={(e) => setInterest1(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-neutral-300 mb-1 block">
            관심사 하나 더 (선택)
          </label>
          <input
            className="w-full bg-neutral-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="예: 카페 투어"
            value={interest2}
            onChange={(e) => setInterest2(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-neutral-300 mb-1 block">
            요즘 하려는 일 / 계획
          </label>
          <input
            className="w-full bg-neutral-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="예: 자격증 시험 준비"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="text-sm text-neutral-300 mb-2 block">누구한테 전화 받을까요?</label>
        <div className="grid grid-cols-2 gap-2">
          {PERSONAS.map((persona) => (
            <button
              key={persona.id}
              onClick={() => setPersonaId(persona.id)}
              className={`text-left rounded-xl px-3 py-3 border transition-colors ${
                personaId === persona.id
                  ? "bg-purple-600/20 border-purple-500"
                  : "bg-neutral-800 border-transparent"
              }`}
            >
              <div className="text-2xl mb-1">{persona.emoji}</div>
              <div className="text-sm font-medium">{persona.name}</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">{persona.tagline}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-400 leading-relaxed">
        콘텐츠에 오래 빠져 있으면, 가끔 전화로 말 걸어드릴게요.
      </div>

      <div className="flex-1" />

      <button
        disabled={!canSubmit}
        onClick={() =>
          onComplete({
            interests: [interest1, interest2].map((v) => v.trim()).filter(Boolean),
            plan: plan.trim(),
            personaId,
          })
        }
        className="w-full py-4 rounded-full bg-purple-600 disabled:bg-neutral-700 disabled:text-neutral-500 font-medium transition-colors"
      >
        시작하기
      </button>
    </div>
  );
}
