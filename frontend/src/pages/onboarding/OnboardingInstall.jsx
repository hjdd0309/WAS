import { useEffect, useState } from 'react'
import ProgressDots from '../../components/ProgressDots'
import OnboardingActions from '../../components/OnboardingActions'
import useInstallPrompt from '../../hooks/useInstallPrompt'
import { isAndroid, isIOS, isStandalone } from '../../lib/platform'

function getNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export default function OnboardingInstall({ onBack, onNext }) {
  const { canInstall, promptInstall } = useInstallPrompt()
  const [standalone, setStandalone] = useState(isStandalone())
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission())

  const ios = isIOS()
  const android = isAndroid()

  useEffect(() => {
    // 설치 프롬프트를 수락하고 실제로 홈 화면 앱으로 재실행되면 display-mode가 바뀐다.
    const mq = window.matchMedia?.('(display-mode: standalone)')
    if (!mq) return
    const handler = () => setStandalone(isStandalone())
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  const handleInstallClick = async () => {
    const outcome = await promptInstall()
    if (outcome === 'accepted') setStandalone(isStandalone())
  }

  const handleNotifyClick = async () => {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    setNotifPermission(permission)
  }

  return (
    <div className="flex h-full flex-col px-6 pb-8 pt-6">
      <h1 className="text-[26px] font-semibold leading-[1.35] text-white">
        전화 알림을 받으려면
        <br />
        <span className="text-accent">설정이 필요해요</span>
      </h1>
      <p className="mt-2 text-[15px] leading-[1.6] text-[#919191]">
        앱을 벗어나 있을 때도 위스피가 전화를 걸 수 있게, 딱 두 가지만 해주세요
      </p>

      <div className="no-scrollbar mt-6 min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3">
          <div className="rounded-[20px] border border-accent/40 bg-[#241e28] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold text-white">① 홈 화면에 추가</p>
              {standalone && <span className="text-[12px] font-medium text-accent-soft">완료 ✓</span>}
            </div>

            {standalone ? (
              <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">
                홈 화면 앱으로 실행 중이에요.
              </p>
            ) : ios ? (
              <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">
                Safari 하단(또는 상단) 공유 버튼
                <span className="mx-1 inline-block rounded bg-white/10 px-1.5 py-0.5 text-white">
                  ⬆
                </span>
                을 누르고 <span className="text-white">&lsquo;홈 화면에 추가&rsquo;</span>를 선택해주세요.
              </p>
            ) : android ? (
              <>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">
                  버튼을 눌러 위스피를 앱처럼 설치할 수 있어요.
                </p>
                <button
                  onClick={handleInstallClick}
                  disabled={!canInstall}
                  className="mt-3 h-11 w-full rounded-[14px] bg-accent text-[14px] font-semibold text-black disabled:opacity-40"
                >
                  {canInstall ? '홈 화면에 추가하기' : '잠시 후 다시 시도해주세요'}
                </button>
              </>
            ) : (
              <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">
                모바일 브라우저(Chrome/Safari)로 접속하면 홈 화면에 추가할 수 있어요.
              </p>
            )}
          </div>

          <div className="rounded-[20px] border border-accent/40 bg-[#241e28] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold text-white">② 알림 허용</p>
              {notifPermission === 'granted' && (
                <span className="text-[12px] font-medium text-accent-soft">완료 ✓</span>
              )}
            </div>

            {notifPermission === 'granted' ? (
              <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">알림이 허용됐어요.</p>
            ) : notifPermission === 'denied' ? (
              <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">
                알림이 차단돼 있어요. 브라우저/시스템 설정에서 위스피 알림을 직접 허용해주세요.
              </p>
            ) : notifPermission === 'unsupported' ? (
              <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">
                이 브라우저는 알림을 지원하지 않아요.
              </p>
            ) : (
              <>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">
                  임계값을 넘으면 위스피가 알림으로 먼저 찾아갈게요.
                </p>
                <button
                  onClick={handleNotifyClick}
                  className="mt-3 h-11 w-full rounded-[14px] bg-accent text-[14px] font-semibold text-black"
                >
                  알림 허용하기
                </button>
              </>
            )}
          </div>

          {ios && !standalone && (
            <p className="px-1 text-[12px] leading-[1.6] text-white/40">
              iOS는 홈 화면에 추가하지 않으면 알림을 받을 수 없어요. ①을 먼저 해주세요.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 pt-4">
        <ProgressDots total={8} activeIndex={6} />
        <OnboardingActions onBack={onBack} onNext={onNext} />
      </div>
    </div>
  )
}
