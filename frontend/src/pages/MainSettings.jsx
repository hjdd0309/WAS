import StatusBar from '../components/StatusBar'
import { getPersona } from '../personas'

export default function MainSettings({ apps, onOpenAppPicker, onEditApp, onTestCall }) {
  return (
    <div className="flex h-full w-full flex-col bg-white px-6 pb-8 pt-3">
      <StatusBar dark />

      <h1 className="mt-6 text-[26px] font-bold text-gray-900">몰입 개입 설정</h1>
      <p className="mt-1 text-[15px] text-gray-400">
        앱과 시간을 정해두면, 넘었을 때 전화가 와요
      </p>

      <div className="mt-8 flex flex-col gap-2">
        <p className="text-[13px] font-medium text-gray-400">모니터링 앱</p>

        {apps.length === 0 && (
          <div className="mb-1 flex flex-col items-center gap-2 rounded-2xl bg-gray-50 px-4 py-10 text-center">
            <span className="text-3xl">📵</span>
            <p className="text-[14px] font-medium text-gray-500">
              아직 감시 중인 앱이 없어요
            </p>
            <p className="text-[12px] text-gray-400">
              아래에서 앱과 사용 시간을 추가해보세요
            </p>
          </div>
        )}

        {apps.map((app) => {
          const persona = getPersona(app.personaId)
          return (
            <button
              key={app.id}
              onClick={() => onEditApp(app)}
              className="flex w-full flex-col gap-3 rounded-2xl bg-gray-50 p-4 text-left active:opacity-70"
            >
              <div className="flex w-full items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-xl"
                  style={{ background: app.bg }}
                >
                  {app.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{app.name}</p>
                  <p className="text-[13px] text-gray-400">{app.limitMinutes}분</p>
                </div>
                <span className="flex items-center gap-1 text-[12px] font-medium text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  모니터링 중
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2">
                <span className="text-base">{persona.emoji}</span>
                <span className="text-[12px] font-medium text-gray-600">
                  전화는 &lsquo;{persona.name}&rsquo;로 걸려와요
                </span>
              </div>
            </button>
          )
        })}

        <button
          onClick={onOpenAppPicker}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-gray-200 p-4 font-semibold text-accent active:opacity-70"
        >
          + 앱 추가하기
        </button>
      </div>

      <div className="flex-1" />

      {apps.length > 0 && (
        <button
          onClick={onTestCall}
          className="text-center text-sm font-medium text-gray-400 underline underline-offset-2"
        >
          지금 바로 체험하기
        </button>
      )}
    </div>
  )
}
