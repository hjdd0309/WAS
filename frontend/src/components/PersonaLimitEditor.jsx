// 대화 시간 설정 UI. 온보딩 5단계와 앱별 관리 화면(AppManage)이 이 조각을 공유한다.
// onRemove는 AppManage처럼 "이미 등록된 앱을 그만 모니터링하기"가 의미 있는
// 곳에서만 넘겨준다 — 온보딩(MonitorSetupForm)은 넘기지 않으므로 그대로 안 보임.
export default function PersonaLimitEditor({ limitMinutes, onChangeLimit, onRemove }) {
  const adjustLimit = (delta) => onChangeLimit(Math.min(120, Math.max(5, limitMinutes + delta)))

  return (
    <div className="flex flex-col gap-5 rounded-[20px] border border-accent/40 bg-[#241e28] p-5">
      <div>
        <p className="mb-3 text-[15px] font-semibold text-white">대화 시간을 설정해요.</p>
        <div className="flex items-center justify-between">
          <button
            onClick={() => adjustLimit(-5)}
            aria-label="5분 줄이기"
            className="flex size-11 items-center justify-center rounded-full border border-accent/40 text-xl font-semibold text-white active:opacity-70"
          >
            −
          </button>
          <span className="text-[18px] font-semibold text-white">{limitMinutes}분</span>
          <button
            onClick={() => adjustLimit(5)}
            aria-label="5분 늘리기"
            className="flex size-11 items-center justify-center rounded-full border border-accent/40 text-xl font-semibold text-white active:opacity-70"
          >
            +
          </button>
        </div>
      </div>

      {onRemove && (
        <button
          onClick={onRemove}
          className="text-[12px] font-medium text-[#ff453a] active:opacity-70"
        >
          이 앱 그만 모니터링하기
        </button>
      )}
    </div>
  )
}
