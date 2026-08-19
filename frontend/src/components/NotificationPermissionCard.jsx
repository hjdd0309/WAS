import { useState } from 'react'
import { subscribeToPush } from '../lib/push'

function getNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

// 온보딩(OnboardingInstall)과 설정 화면 둘 다에서 쓰는 "알림 허용" 카드.
export default function NotificationPermissionCard({ title = '알림 허용' }) {
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission)

  const handleNotifyClick = async () => {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    setNotifPermission(permission)
    if (permission === 'granted') subscribeToPush()
  }

  return (
    <div className="rounded-[20px] border border-accent/40 bg-[#241e28] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold text-white">{title}</p>
        {notifPermission === 'granted' && (
          <span className="text-[12px] font-medium text-accent-soft">완료 ✓</span>
        )}
      </div>

      {notifPermission === 'granted' ? (
        <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">알림이 허용됐어요.</p>
      ) : notifPermission === 'denied' ? (
        <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">
          알림이 차단돼 있어요. 브라우저/시스템 설정에서 잠깐만 알림을 직접 허용해주세요.
        </p>
      ) : notifPermission === 'unsupported' ? (
        <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">이 브라우저는 알림을 지원하지 않아요.</p>
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
  )
}
