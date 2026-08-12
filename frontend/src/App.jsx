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

const initial = loadState()
const TABS = ['home', 'log', 'report', 'settings']

export default function App() {
  // screen: 지금 보여줄 화면. 온보딩을 마치기 전엔 항상 onboarding부터 시작한다.
  const [screen, setScreen] = useState(initial.onboarded ? 'home' : 'onboarding')
  const [profile, setProfile] = useState(initial)

  useEffect(() => {
    saveState(profile)
  }, [profile])

  const app = useMemo(() => getApp(profile.appId), [profile.appId])
  const persona = useMemo(() => getPersona(profile.personaId), [profile.personaId])

  const handleOnboardingComplete = (data) => {
    setProfile({ ...data, onboarded: true })
    setScreen('home')
  }

  const updateProfile = (partial) => setProfile((prev) => ({ ...prev, ...partial }))

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

      {screen === 'home' && <Home app={app} persona={persona} limitMinutes={profile.limitMinutes} {...tabProps} />}

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
