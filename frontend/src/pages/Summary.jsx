import Button from '../components/Button'
import StatusBar from '../components/StatusBar'
import { formatDuration } from '../hooks/useCallTimer'

const suggestions = [
  '🧘 1분 스트레칭 하기',
  '💧 물 한 잔 마시기',
  '📓 지금 떠오른 생각 적어보기',
]

export default function Summary({ app, duration = 0, onHome }) {
  return (
    <div className="flex h-full w-full flex-col bg-white px-6 pb-10 pt-3">
      <StatusBar dark />

      <div className="flex flex-1 flex-col items-center justify-between pt-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-light">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3182f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">몰입에서 빠져나왔어요</h1>
          <p className="leading-relaxed text-gray-500">
            {app ? `${app.name} 사용을 멈추고, ` : ''}
            WAS와 {formatDuration(duration)} 동안 대화했어요.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          {suggestions.map((text) => (
            <div
              key={text}
              className="rounded-2xl bg-gray-50 p-4 text-left font-medium text-gray-700"
            >
              {text}
            </div>
          ))}
        </div>

        <Button onClick={onHome} className="w-full">
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  )
}
