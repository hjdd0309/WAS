import ProgressDots from '../../components/ProgressDots'
import OnboardingActions from '../../components/OnboardingActions'
import TagInput from '../../components/TagInput'

const MAX_PLAN_LENGTH = 200

export default function OnboardingPersonalize({ interests, onChangeInterests, plan, onChangePlan, onBack, onNext }) {
  return (
    <div className="flex h-full flex-col px-6 pb-8 pt-6">
      <h1 className="text-[26px] font-semibold leading-[1.35] text-white">
        조금 더 알려주세요
      </h1>
      <p className="mt-2 text-[15px] leading-[1.6] text-[#919191]">
        전화할 때 티 안 나게, 자연스럽게 활용할게요
      </p>

      <div className="no-scrollbar mt-6 min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-[13px] font-medium text-[#919191]">
              관심사 <span className="text-white/30">(선택)</span>
            </p>
            <TagInput
              value={interests}
              onChange={onChangeInterests}
              placeholder="예: 축구, 카페, K-pop"
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-[#919191]">
              요즘 하려는 일 <span className="text-white/30">(선택)</span>
            </p>
            <input
              value={plan}
              onChange={(e) => onChangePlan(e.target.value.slice(0, MAX_PLAN_LENGTH))}
              placeholder="예: 자격증 공부, 운동 루틴 만들기"
              className="w-full rounded-[16px] border border-accent/40 bg-[#241e28] p-3.5 text-[16px] text-white outline-none placeholder:text-white/30"
            />
            <p className="mt-2 text-[12px] leading-[1.6] text-white/30">
              전화 마무리에 "저번에 말한 거 어떻게 됐어?"처럼 자연스럽게 되짚어줘요
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 pt-4">
        <ProgressDots total={8} activeIndex={5} />
        <OnboardingActions onBack={onBack} onNext={onNext} />
      </div>
    </div>
  )
}
