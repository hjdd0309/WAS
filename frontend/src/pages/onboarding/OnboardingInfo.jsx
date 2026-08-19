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
  descriptionMinHeight = 90,
  activeIndex,
  ctaLabel = '다음',
  onBack,
  onNext,
}) {
  return (
    <div className="flex h-full flex-col px-6 pb-6 pt-3">
      <div className="no-scrollbar min-h-0 flex flex-1 flex-col items-center justify-start overflow-y-auto">
        {/* justify-center 대신 앞뒤 spacer로 중앙 정렬한다: 공간이 남으면 위아래로 똑같이
            늘어나 중앙에 오고, 모자라면 spacer가 먼저 0으로 줄어서(콘텐츠는 그대로 유지)
            아래쪽으로만 자연스럽게 스크롤되게 한다. */}
        <div className="min-h-0 flex-1 shrink" aria-hidden="true" />

        <div className="flex shrink-0 items-center justify-center" style={{ width: slotSize.width, height: slotSize.height }}>
          <div
            className="relative overflow-hidden rounded-[29px]"
            style={{ width: crop.containerW, height: crop.containerH }}
          >
            <img
              src={onboardingComposite}
              alt=""
              className="absolute max-w-none"
              style={
                crop.w != null
                  ? { width: crop.w, height: crop.h, left: crop.left, top: crop.top }
                  : { left: crop.left, top: crop.top }
              }
            />
          </div>
        </div>

        <div className="mt-5 shrink-0">
          <h1 className={`${headingSizeClass} font-semibold leading-[1.4] text-white`}>
            {heading}
            <br />
            <span className="text-accent">{headingAccent}</span>
          </h1>
          {/* 스텝마다 설명 줄 수가 달라도 이미지 위치가 흔들리지 않도록
              가장 긴 설명 기준 높이를 항상 확보해둔다. */}
          <p
            className={`mt-2 ${descriptionSizeClass} leading-[1.7] text-[#919191]`}
            style={{ minHeight: descriptionMinHeight }}
          >
            {description}
          </p>
        </div>

        <div className="min-h-0 flex-1 shrink" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-3 pt-3">
        <ProgressDots total={8} activeIndex={activeIndex} />
        <OnboardingActions onBack={onBack} onNext={onNext} ctaLabel={ctaLabel} />
      </div>
    </div>
  )
}
