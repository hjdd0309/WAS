import type { GeneratedCall } from "../script";

export default function LogScreen({
  reasoning,
  onBack,
}: {
  reasoning: GeneratedCall["reasoning"];
  onBack: () => void;
}) {
  return (
    <div className="w-full h-full bg-neutral-950 text-white flex flex-col px-6 pt-16 pb-8">
      <h1 className="text-lg font-semibold mb-1">판단 근거</h1>
      <p className="text-xs text-neutral-500 mb-8">
        안 봐도 되지만, 궁금할 때 확인할 수 있어요.
      </p>

      <div className="space-y-4 flex-1">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
          <p className="text-xs text-neutral-500 mb-1">전화를 건 이유</p>
          <p className="text-sm">{reasoning.triggerSummary}</p>
        </div>

        {reasoning.interestUsed && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
            <p className="text-xs text-neutral-500 mb-1">화제 선택에 사용한 정보</p>
            <p className="text-sm">
              온보딩에서 알려준 관심사 &quot;{reasoning.interestUsed}&quot;를 참고해 에피소드를 골랐어요.
            </p>
          </div>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
          <p className="text-xs text-neutral-500 mb-1">마무리 방식</p>
          <p className="text-sm">
            {reasoning.closingVersion === "B"
              ? "이전에 알려준 계획을 다시 물어보며 마무리했어요."
              : "지금부터 뭘 할지 직접 정할 수 있도록 열린 질문으로 마무리했어요."}
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
          <p className="text-xs text-neutral-500 mb-1">하지 않은 것</p>
          <p className="text-sm text-neutral-300">
            보고 있던 콘텐츠 내용은 화제로 삼지 않았어요. 감시받는 느낌을 주지 않기 위해서예요.
          </p>
        </div>
      </div>

      <button
        onClick={onBack}
        className="w-full py-4 rounded-full bg-neutral-800 font-medium"
      >
        닫기
      </button>
    </div>
  );
}
