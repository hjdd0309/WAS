import onboardingComposite from '../../assets/illustrations/onboarding-composite.png'
import PillButton from '../../components/PillButton'
import ProgressDots from '../../components/ProgressDots'

export default function OnboardingInfo({
  crop,
  heading,
  headingAccent,
  description,
  activeIndex,
  ctaLabel = '다음',
  onNext,
}) {
  return (
    <div className="flex h-full flex-col px-6 pb-8 pt-4">
      <div className="min-h-0 flex flex-1 flex-col items-center gap-8 overflow-y-auto pt-2">
        <div
          className="relative overflow-hidden rounded-[29px]"
          style={{ width: crop.containerW, height: crop.containerH }}
        >
          <img
            src={onboardingComposite}
            alt=""
            className="absolute max-w-none"
            style={{ width: crop.w, height: crop.h, left: crop.left, top: crop.top }}
          />
        </div>

        <div>
          <h1 className="text-[26px] font-semibold leading-[1.4] text-white">
            {heading}
            <br />
            <span className="text-accent">{headingAccent}</span>
          </h1>
          <p className="mt-4 text-[16px] leading-[1.7] text-[#919191]">{description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 pt-4">
        <ProgressDots total={6} activeIndex={activeIndex} />
        <PillButton onClick={onNext}>{ctaLabel}</PillButton>
      </div>
    </div>
  )
}
