import TagInput from '../components/TagInput'

const MAX_PLAN_LENGTH = 200

export default function ProfileEdit({ interests, plan, onChangeInterests, onChangePlan, onBack }) {
  return (
    <div className="flex h-full w-full flex-col bg-[#1b171c]">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="뒤로"
            className="flex size-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-[20px] font-bold text-white">관심사·계획 수정</h1>
        </div>
        <p className="mt-2 pl-[3px] text-[13px] text-[#919191]">
          온보딩에서 입력했던 내용을 언제든 바꿀 수 있어요
        </p>

        <div className="mt-6 flex flex-col gap-6">
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
    </div>
  )
}
