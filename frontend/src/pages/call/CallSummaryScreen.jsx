import PillButton from '../../components/PillButton'
import { formatDuration } from '../../hooks/useCallTimer'

const SUGGESTIONS = [
  '🧘 1분 스트레칭 하기',
  '💧 물 한 잔 마시기',
  '📓 지금 떠오른 생각 적어보기',
]

export default function CallSummaryScreen({ app, persona, duration = 0, onHome }) {
  return (
    <div className="flex h-full w-full flex-col bg-[#1b171c] px-6 pb-10 pt-14">
      <div className="flex flex-1 flex-col items-center justify-between text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-accent/15">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#b190ea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-[24px] font-bold text-white">몰입에서 빠져나왔어요</h1>
          <p className="leading-relaxed text-[15px] text-[#919191]">
            {app ? `${app.name} 사용을 멈추고, ` : ''}
            {persona?.name ?? '위스피'}와 {formatDuration(duration)} 동안 대화했어요.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          {SUGGESTIONS.map((text) => (
            <div
              key={text}
              className="rounded-[16px] border border-[#695b69]/60 bg-[#1d191d] p-4 text-left text-[14px] font-medium text-white"
            >
              {text}
            </div>
          ))}
        </div>

        <PillButton onClick={onHome} className="w-full">
          홈으로 돌아가기
        </PillButton>
      </div>
    </div>
  )
}
