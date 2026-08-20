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
            {canInstall
              ? '버튼을 눌러 위스피를 앱처럼 설치할 수 있어요.'
              : '이미 설치했다면 홈 화면의 위스피 아이콘으로 열어주세요. 아직이라면 잠시 후 이 버튼이 눌려요(브라우저가 준비 중).'}
          </p>
          <button
            onClick={handleInstallClick}
            disabled={!canInstall}
            className="mt-3 h-11 w-full rounded-[14px] bg-accent text-[14px] font-semibold text-black disabled:opacity-40"
          >
            {canInstall ? '홈 화면에 추가하기' : '설치 준비 중 (또는 이미 설치됨)'}
          </button>
          {!canInstall && (
            <p className="mt-2 px-1 text-[11px] leading-[1.5] text-white/40">
              지금 바로 다시 설치하고 싶다면, 브라우저 오른쪽 위 메뉴(⋮) → &lsquo;설치&rsquo; 또는
              &lsquo;홈 화면에 추가&rsquo;에서 직접 할 수도 있어요.
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 text-[13px] leading-[1.6] text-[#919191]">
          모바일 브라우저(Chrome/Safari)로 접속하면 홈 화면에 추가할 수 있어요.
        </p>
      )}
    </div>
  )
}
