import { useEffect, useState } from 'react'
import useInstallPrompt from '../hooks/useInstallPrompt'
import { isAndroid, isIOS, isStandalone } from '../lib/platform'

// 온보딩(OnboardingInstall)과 설정 화면 둘 다에서 쓰는 "홈 화면에 추가" 카드.
// 플랫폼별 안내가 갈리는 로직(설치 프롬프트 캡처, iOS 수동 안내 등)을 한 곳에
// 모아 두 화면이 서로 다르게 동작하는 걸 방지한다.
export default function HomeScreenInstallCard({ title = '홈 화면에 추가' }) {
  const { canInstall, promptInstall } = useInstallPrompt()
  const [standalone, setStandalone] = useState(isStandalone())

  const ios = isIOS()
  const android = isAndroid()

  useEffect(() => {
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

  return (
    <div className="rounded-[20px] border border-accent/40 bg-[#241e28] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold text-white">{title}</p>
        {standalone && <span className="text-[12px] font-medium text-accent-soft">완료 ✓</span>}
      </div>

      {standalone ? (
        <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">홈 화면 앱으로 실행 중이에요.</p>
      ) : ios ? (
        <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">
          Safari 하단(또는 상단) 공유 버튼
          <span className="mx-1 inline-block rounded bg-white/10 px-1.5 py-0.5 text-white">⬆</span>
          을 누르고 <span className="text-white">&lsquo;홈 화면에 추가&rsquo;</span>를 선택해주세요.
        </p>
      ) : android ? (
        <>
          <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">
            버튼을 눌러 잠깐만을 앱처럼 설치할 수 있어요.
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
  )
}
