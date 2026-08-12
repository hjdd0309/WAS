import onboardingComposite from '../../assets/illustrations/onboarding-composite.png'
import ProgressDots from '../../components/ProgressDots'
import OnboardingActions from '../../components/OnboardingActions'

export default function OnboardingReady({ onBack, onComplete }) {
  return (
    <div className="flex h-full flex-col px-6 pb-8 pt-6">
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto">
        <div className="relative h-[250px] w-[195px] overflow-hidden rounded-[29px]">
          <img
            src={onboardingComposite}
            alt="위스피가 전화를 거는 화면 미리보기"
            className="absolute max-w-none h-[285.87%] w-[443.87%]"
            style={{ left: '-225.3%', top: '-39.85%' }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <ProgressDots total={6} activeIndex={5} />
        <OnboardingActions onBack={onBack} onNext={onComplete} ctaLabel="위스피와 대화해볼까요?" />
      </div>
    </div>
  )
}
