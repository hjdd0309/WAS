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
    // 홈 인디케이터 제스처는 CallSplash에서만 켠다 — BottomNav가 있는 화면에서 켜두면
    // 그 히트존이 기록/리포트 탭 버튼 위에 겹쳐 탭을 가로채 버린다.
    <PhoneFrame onHomeGesture={screen === 'callSplash' ? () => setScreen('home') : undefined}>
      {screen === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}

      {screen === 'callSplash' && <CallSplash onDismiss={() => setScreen('home')} />}

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
