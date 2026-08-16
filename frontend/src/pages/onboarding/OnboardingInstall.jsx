import { useEffect } from 'react'
import ProgressDots from '../../components/ProgressDots'
import OnboardingActions from '../../components/OnboardingActions'
import HomeScreenInstallCard from '../../components/HomeScreenInstallCard'
import NotificationPermissionCard from '../../components/NotificationPermissionCard'
import { isIOS, isStandalone } from '../../lib/platform'
import { subscribeToPush } from '../../lib/push'

export default function OnboardingInstall({ onBack, onNext }) {
  const ios = isIOS()
  const standalone = isStandalone()

  useEffect(() => {
    // 이전 방문에서 이미 알림 권한을 허용했다면(브라우저 권한은 유지되지만
    // 서버 구독은 재시작 등으로 날아갔을 수 있음) 조용히 재구독을 시도한다.
    // subscribeToPush는 기존 브라우저 구독을 재사용하므로 반복 호출해도 안전하다.
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      subscribeToPush()
    }
  }, [])

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
          <HomeScreenInstallCard title="① 홈 화면에 추가" />
          <NotificationPermissionCard title="② 알림 허용" />

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
