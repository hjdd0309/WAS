import { useEffect, useMemo, useState } from 'react'
import PhoneFrame from './components/PhoneFrame'
import Onboarding from './pages/onboarding/Onboarding'
import Home from './pages/Home'
import Log from './pages/Log'
import Report from './pages/Report'
import Settings from './pages/Settings'
import CallSplash from './pages/CallSplash'
import { getApp } from './apps'
import { getPersona } from './personas'
import { loadState, saveState } from './lib/storage'
import useAwayMonitor from './hooks/useAwayMonitor'

const initial = loadState()
const TABS = ['home', 'log', 'report', 'settings']

function hasCallDeepLink() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('call') === '1'
}

export default function App() {
  // screen: 지금 보여줄 화면. 온보딩을 마치기 전엔 항상 onboarding부터 시작한다.
  // 초기화 함수는 순수하게 "읽기"만 한다 — StrictMode(개발 모드)에서 두 번 호출돼도
  // 안전하도록, URL을 지우는 부수효과는 아래 별도 useEffect로 뺐다.
  const [screen, setScreen] = useState(() => {
    if (initial.onboarded && hasCallDeepLink()) return 'callSplash'
    return initial.onboarded ? 'home' : 'onboarding'
  })
  const [profile, setProfile] = useState(initial)

  useEffect(() => {
    saveState(profile)
  }, [profile])

  // 알림을 탭해서 열렸을 때(?call=1)와 새로고침을 구분해야 하므로, 한 번
  // 읽은 뒤에는 주소창에서 지워 다음 새로고침에 또 통화 화면으로 튀지 않게 한다.
  useEffect(() => {
    if (hasCallDeepLink()) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const app = useMemo(() => getApp(profile.appId), [profile.appId])
  const persona = useMemo(() => getPersona(profile.personaId), [profile.personaId])

  const handleOnboardingComplete = (data) => {
    setProfile({ ...data, onboarded: true })
    setScreen('home')
  }

  const updateProfile = (partial) => setProfile((prev) => ({ ...prev, ...partial }))

  // 이미 열려 있던 탭이 알림 클릭으로 포커스된 경우(새 탭이 아니라서 URL을
  // 다시 읽지 않음) — 서비스워커가 postMessage로 알려준다.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined
    const handleMessage = (event) => {
      if (event.data?.type === 'was:open-call') setScreen('callSplash')
    }
    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [])

  // "다른 앱 사용 시간"은 브라우저가 알 수 없어서, 이 앱을 벗어나 있던
  // 시간을 근사치로 쓴다 — 통화 중/온보딩 중에는 재트리거되지 않게 막는다.
  const { awaySeconds } = useAwayMonitor({
    enabled: profile.onboarded && screen !== 'onboarding' && screen !== 'callSplash',
    limitMinutes: profile.limitMinutes,
    personaName: persona.name,
    onThresholdReached: () => setScreen('callSplash'),
  })

  const tabProps = {
    onNavigate: (tab) => {
      if (TABS.includes(tab)) setScreen(tab)
    },
    onCallPress: () => setScreen('callSplash'),
  }

  return (
    // 통화 화면은 실제 WebRTC 연결을 들고 있어서, 정리(hangup) 없이 제스처로
    // 바로 홈으로 빠져나가면 마이크/연결이 안 끊긴 채 남는다. 그래서 홈 인디케이터
    // 제스처는 항상 꺼두고, 각 화면 자체의 종료 버튼(취소/통화종료/홈으로)만 쓴다.
    <PhoneFrame>
      {screen === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}

      {screen === 'callSplash' && (
        <CallSplash
          app={app}
          persona={persona}
          profile={profile}
          onHome={() => setScreen('home')}
          onSaveSummary={(previousSummary) => updateProfile({ previousSummary })}
        />
      )}

      {screen === 'home' && (
        <Home
          app={app}
          persona={persona}
          limitMinutes={profile.limitMinutes}
          awaySeconds={awaySeconds}
          {...tabProps}
        />
      )}

      {screen === 'log' && <Log {...tabProps} />}

      {screen === 'report' && <Report {...tabProps} />}

      {screen === 'settings' && (
        <Settings
          app={app}
          persona={persona}
          limitMinutes={profile.limitMinutes}
          onUpdateProfile={updateProfile}
          {...tabProps}
        />
      )}
    </PhoneFrame>
  )
}
