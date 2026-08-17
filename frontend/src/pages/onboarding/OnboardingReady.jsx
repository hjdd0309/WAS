import callingWispy from '../../assets/illustrations/calling-wispy.png'
import ProgressDots from '../../components/ProgressDots'
import OnboardingActions from '../../components/OnboardingActions'

export default function OnboardingReady({ onComplete }) {
  return (
    <div className="flex h-full flex-col px-6 pb-8 pt-6">
      <img
        src={callingWispy}
        alt="위스피가 전화를 거는 화면 미리보기"
        className="my-auto w-full max-w-[330px] self-center"
      />

      <div className="flex flex-col gap-6">
        <ProgressDots total={8} activeIndex={7} />
        <OnboardingActions onNext={onComplete} ctaLabel="위스피와 대화해볼까요?" />
      </div>
    </div>
  )
}
