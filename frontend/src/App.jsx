import { useEffect, useMemo, useState } from 'react'
import PhoneFrame from './components/PhoneFrame'
import Onboarding from './pages/onboarding/Onboarding'
import Home from './pages/Home'
import Log from './pages/Log'
import Report from './pages/Report'
import Settings from './pages/Settings'
import AppManage from './pages/AppManage'
import ProfileEdit from './pages/ProfileEdit'
import CallSplash from './pages/CallSplash'
import DemoExperience from './pages/DemoExperience'
import { getApp } from './apps'
import { getPersona, DEFAULT_PERSONA_ID } from './personas'
import { loadState, saveState } from './lib/storage'
import { saveProfile } from './lib/api'
import { prefetchCallSession } from './lib/callSession'
import { showCallNotification } from './lib/notify'
import { fetchNotificationPreviewText } from './lib/push'
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

  // 앱을 여러 개 등록해도 실제로 감시할 수 있는 건 "가장 먼저 한도에 도달할 앱"
  // 하나뿐 — 모니터링 타이머가 앱 전체에 공통이므로, 제한 시간이 가장 짧은 앱이
  // 항상 먼저 울리고, 그 앱의 페르소나로 전화가 온다.
  const soonestApp = useMemo(() => {
    if (profile.apps.length === 0) return null
    return profile.apps.reduce((min, a) => (a.limitMinutes < min.limitMinutes ? a : min), profile.apps[0])
  }, [profile.apps])

  const app = useMemo(() => getApp(soonestApp?.appId), [soonestApp])
  const persona = useMemo(() => getPersona(soonestApp?.personaId), [soonestApp])

  // 서버 쪽 메모리(userid 기반 KV)를 관심사/계획/루틴/현재 페르소나가 바뀔 때마다
  // 최신 상태로 동기화한다 — 통화 프롬프트 백필과 푸시 알림 문구 생성이 이걸 읽는다.
  // 실패해도(오프라인 등) 조용히 무시됨(lib/api.js) — localStorage가 항상 안전망.
  useEffect(() => {
    if (!profile.onboarded) return
    saveProfile({
      interests: profile.interests,
      plan: profile.plan,
      personaId: soonestApp?.personaId,
    })
  }, [profile.onboarded, profile.interests, profile.plan, soonestApp?.personaId])

  // 홈 화면에 머무는 동안 통화 세션을 미리 하나 받아둔다 — 실제로 전화
  // 버튼을 누르는 순간 /api/call 왕복을 기다리지 않도록 하기 위함
  // (useRealtimeCall.connect 참고). 관심사/계획/페르소나가 바뀌면 다시 받는다.
  useEffect(() => {
    if (screen !== 'home' || !soonestApp) return
    prefetchCallSession({
      interests: profile.interests,
      plan: profile.plan,
      personaId: persona.id,
      previousSummary: profile.previousSummary,
    })
  }, [screen, profile.interests, profile.plan, profile.previousSummary, soonestApp, persona.id])

  const handleOnboardingComplete = (data) => {
    setProfile((prev) => ({
      ...prev,
      goals: data.goals,
      apps: [{ id: crypto.randomUUID(), appId: data.appId, limitMinutes: data.limitMinutes, personaId: data.personaId }],
      interests: data.interests,
      plan: data.plan,
      onboarded: true,
    }))
    setScreen('home')
  }

  const updateProfile = (partial) => setProfile((prev) => ({ ...prev, ...partial }))

  const addCallLog = (entry) =>
    setProfile((prev) => ({ ...prev, callLog: [entry, ...prev.callLog] }))

  const addApp = (appId) =>
    setProfile((prev) => ({
      ...prev,
      apps: [...prev.apps, { id: crypto.randomUUID(), appId, limitMinutes: 45, personaId: DEFAULT_PERSONA_ID }],
    }))

  const updateApp = (id, partial) =>
    setProfile((prev) => ({
      ...prev,
      apps: prev.apps.map((a) => (a.id === id ? { ...a, ...partial } : a)),
    }))

  const removeApp = (id) =>
    setProfile((prev) => ({ ...prev, apps: prev.apps.filter((a) => a.id !== id) }))

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
    enabled:
      profile.onboarded &&
      soonestApp !== null &&
      screen !== 'onboarding' &&
      screen !== 'callSplash' &&
      screen !== 'demo',
    limitMinutes: soonestApp?.limitMinutes ?? 45,
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
          onLogCall={addCallLog}
        />
      )}

      {screen === 'home' && (
        <Home
          app={app}
          monitoredApps={profile.apps}
          interests={profile.interests}
          plan={profile.plan}
          awaySeconds={awaySeconds}
          onManageApps={() => setScreen('appManage')}
          onEditProfile={() => setScreen('profileEdit')}
          // 발표 데모용 — 실제 away 타이머/서버 push를 기다리지 않고 벨 아이콘
          // 탭 한 번으로 통화 알림 배너를 바로 보여준다(팀 결정: 현장에선 실제
          // 푸시 배달을 신뢰할 수 없어 데모는 이 로컬 알림 경로로만 시연).
          // 온보딩에서 알림 허용을 안 눌렀던 세션이면 permission이 'default'라
          // showCallNotification이 조용히 실패하므로, 벨 클릭(=사용자 제스처)
          // 시점에 권한이 없으면 여기서 바로 요청부터 한다.
          onDemoNotification={async () => {
            if (typeof Notification === 'undefined') return
            if (Notification.permission === 'default') {
              await Notification.requestPermission()
            }
            const text = await fetchNotificationPreviewText()
            showCallNotification(persona.name, text)
          }}
          onOpenDemoExperience={() => setScreen('demo')}
          {...tabProps}
        />
      )}

      {screen === 'demo' && (
        <DemoExperience
          persona={persona}
          onExit={() => setScreen('home')}
          onTriggerCall={() => setScreen('callSplash')}
        />
      )}

      {screen === 'appManage' && (
        <AppManage
          monitoredApps={profile.apps}
          onAddApp={addApp}
          onUpdateApp={updateApp}
          onRemoveApp={removeApp}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'log' && <Log callLog={profile.callLog} {...tabProps} />}

      {screen === 'report' && <Report callLog={profile.callLog} {...tabProps} />}

      {screen === 'settings' && (
        <Settings
          monitoredApps={profile.apps}
          interests={profile.interests}
          plan={profile.plan}
          onManageApps={() => setScreen('appManage')}
          onEditProfile={() => setScreen('profileEdit')}
          {...tabProps}
        />
      )}

      {screen === 'profileEdit' && (
        <ProfileEdit
          interests={profile.interests}
          plan={profile.plan}
          onChangeInterests={(interests) => updateProfile({ interests })}
          onChangePlan={(plan) => updateProfile({ plan })}
          onBack={() => setScreen('settings')}
        />
      )}
    </PhoneFrame>
  )
}
