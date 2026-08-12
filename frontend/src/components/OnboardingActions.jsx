import PillButton from './PillButton'

// 온보딩 하단 액션. 뒤로 갈 곳이 있으면(onBack) "이전" + CTA를 나란히,
// 없으면(첫 단계) CTA만 꽉 채워 보여준다.
export default function OnboardingActions({ onBack, onNext, ctaLabel = '다음', nextDisabled }) {
  if (!onBack) {
    return (
      <PillButton onClick={onNext} disabled={nextDisabled} className="w-full">
        {ctaLabel}
      </PillButton>
    )
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="h-[72px] w-[92px] shrink-0 rounded-[22px] bg-white/10 text-[16px] font-semibold text-white transition-opacity active:opacity-70"
      >
        이전
      </button>
      <PillButton onClick={onNext} disabled={nextDisabled} className="flex-1">
        {ctaLabel}
      </PillButton>
    </div>
  )
}
