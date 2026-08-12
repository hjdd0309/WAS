import onboardingComposite from '../../assets/illustrations/onboarding-composite.png'
import ProgressDots from '../../components/ProgressDots'
import OnboardingActions from '../../components/OnboardingActions'

export default function OnboardingInfo({
  crop,
  slotSize = { width: 222, height: 250 },
  heading,
  headingAccent,
  headingSizeClass = 'text-[26px]',
  description,
  descriptionSizeClass = 'text-[16px]',
  descriptionMinHeight = 110,
  activeIndex,
  ctaLabel = '다음',
  onBack,
  onNext,
}) {
  return (
    <div className="flex h-full flex-col px-6 pb-8 pt-4">
      <div className="no-scrollbar min-h-0 flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto">
        <div className="flex items-center justify-center" style={{ width: slotSize.width, height: slotSize.height }}>
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
        </div>

        <div>
          <h1 className={`${headingSizeClass} font-semibold leading-[1.4] text-white`}>
            {heading}
            <br />
            <span className="text-accent">{headingAccent}</span>
          </h1>
          {/* 스텝마다 설명 줄 수가 달라도 이미지 위치가 흔들리지 않도록
              가장 긴 설명 기준 높이를 항상 확보해둔다. */}
          <p
            className={`mt-4 ${descriptionSizeClass} leading-[1.7] text-[#919191]`}
            style={{ minHeight: descriptionMinHeight }}
          >
            {description}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 pt-4">
        <ProgressDots total={8} activeIndex={activeIndex} />
        <OnboardingActions onBack={onBack} onNext={onNext} ctaLabel={ctaLabel} />
      </div>
    </div>
  )
}
