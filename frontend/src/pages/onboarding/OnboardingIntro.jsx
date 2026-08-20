import headphoneIcon from '../../assets/illustrations/onboarding1-headphone-icon.png'
import ProgressDots from '../../components/ProgressDots'
import OnboardingActions from '../../components/OnboardingActions'

export default function OnboardingIntro({ onNext }) {
  return (
    <div className="flex h-full flex-col px-6 pb-8 pt-4">
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col items-center justify-center gap-7 overflow-y-auto text-center">
        <h1 className="text-[32px] font-semibold text-white">
          잠<span className="inline-block rotate-3 text-[38px]">깐</span>만요!
        </h1>

        <img src={headphoneIcon} alt="위스피 마스코트" className="w-full max-w-[226px]" />

        <p className="text-[17px] leading-[1.6] text-[#919191]">
          화면에 빠진 당신을
          <br />
          위스피가 불러낼게요.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <ProgressDots total={8} activeIndex={0} />
        <OnboardingActions onNext={onNext} ctaLabel="시작하기" />
      </div>
    </div>
  )
}
