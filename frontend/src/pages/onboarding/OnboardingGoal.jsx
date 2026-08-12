import PillButton from '../../components/PillButton'
import ProgressDots from '../../components/ProgressDots'

const GOALS = ['집중 시간', '잠들기 전', '퇴근 후', '공부할 때']
const CATCH_ALL = '그냥 덜 보고싶어요'

export default function OnboardingGoal({ selectedGoals, onToggleGoal, onNext }) {
  const isSelected = (goal) => selectedGoals.includes(goal)

  return (
    <div className="flex h-full flex-col px-6 pb-8 pt-6">
      <h1 className="text-[28px] font-semibold leading-[1.35] text-white">
        어떤 시간을
        <br />
        되찾고 싶나요?
      </h1>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {GOALS.map((goal) => (
          <button
            key={goal}
            onClick={() => onToggleGoal(goal)}
            className={`flex h-[99px] items-center justify-center rounded-[20px] border text-[19px] font-semibold transition-colors active:opacity-70 ${
              isSelected(goal)
                ? 'border-accent bg-accent text-black'
                : 'border-accent/40 bg-[#241e28] text-white'
            }`}
          >
            {goal}
          </button>
        ))}
      </div>

      <button
        onClick={() => onToggleGoal(CATCH_ALL)}
        className={`mt-3 flex h-[88px] items-center justify-center rounded-[20px] border text-[19px] font-semibold transition-colors active:opacity-70 ${
          isSelected(CATCH_ALL)
            ? 'border-accent bg-accent text-black'
            : 'border-accent/40 bg-[#241e28] text-white'
        }`}
      >
        {CATCH_ALL}
      </button>

      <p className="mt-6 text-[16px] leading-[1.7] text-[#919191]">
        위스피가 당신의 목표를 기억하고
        <br />
        되찾을 수 있게 도와드릴게요.
      </p>

      <div className="flex-1" />

      <div className="flex flex-col gap-6">
        <ProgressDots total={6} activeIndex={3} />
        <PillButton onClick={onNext}>다음</PillButton>
      </div>
    </div>
  )
}
