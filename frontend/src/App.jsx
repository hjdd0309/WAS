import { useEffect, useMemo, useRef, useState } from 'react'
import PhoneFrame from './components/PhoneFrame'
import CallBanner from './components/CallBanner'
import MainSettings from './pages/MainSettings'
import AppPicker from './pages/AppPicker'
import IncomingCall from './pages/IncomingCall'
import InCall from './pages/InCall'
import Summary from './pages/Summary'
import { getPersona } from './personas'
import { loadState, saveState } from './lib/storage'

const initial = loadState()

export default function App() {
  // screen: 지금 보고 있는 화면 (settings | apppicker)
  const [screen, setScreen] = useState('settings')
  // callPhase: 화면 위에 얹히는 전화 상태 (idle | banner | fullscreen | calling | summary)
  const [callPhase, setCallPhase] = useState('idle')

  // AI 통화 설정(페르소나/관심사/계획)은 앱마다 따로 저장된다 — 앱 편집 화면
  // 안에서 설정하는 값이라 사용자 입장에선 당연히 그 앱만의 설정으로 보인다.
  const [apps, setApps] = useState(initial.apps)

  const [editingApp, setEditingApp] = useState(null)
  const [triggeredApp, setTriggeredApp] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [callConnected, setCallConnected] = useState(false)

  // 설정은 새로고침/재방문에도 유지되도록 로컬에 저장
  useEffect(() => {
    saveState({ apps })
  }, [apps])

  // 여러 앱을 등록해도 실제로 감시할 수 있는 건 "가장 먼저 한도에 도달할 앱"
  // 하나뿐 — 모니터링 시계가 앱 전체에 공통이므로, 제한 시간이 가장 짧은
  // 앱이 항상 먼저 울린다.
  const soonestApp = useMemo(() => {
    if (apps.length === 0) return null
    return apps.reduce((min, a) => (a.limitMinutes < min.limitMinutes ? a : min), apps[0])
  }, [apps])

  // 실제로 전화를 걸어온 앱의 페르소나로 통화 화면을 표시한다.
  const callPersona = useMemo(() => getPersona(triggeredApp?.personaId), [triggeredApp])

  // 모니터링 타이머는 App 최상위에서 계속 돌아, 어떤 화면에 있든 시간이 유지된다.
  const [monitorSeconds, setMonitorSeconds] = useState(0)
  const monitorStartRef = useRef(null)
  const firedRef = useRef(false)
  const monitorActive =
    apps.length > 0 && callPhase !== 'calling' && callPhase !== 'summary'

  useEffect(() => {
    if (!monitorActive) return
    monitorStartRef.current = Date.now() - monitorSeconds * 1000
    const tick = () =>
      setMonitorSeconds(Math.floor((Date.now() - monitorStartRef.current) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
    // monitorSeconds는 의도적으로 deps에서 제외 — 멈췄다 재개할 때 리셋되지 않게 함
  }, [monitorActive])

  useEffect(() => {
    if (monitorSeconds === 0) firedRef.current = false
    if (!soonestApp || firedRef.current) return
    const limitSeconds = soonestApp.limitMinutes * 60
    if (monitorSeconds >= limitSeconds) {
      firedRef.current = true
      setTriggeredApp(soonestApp)
      setCallPhase('banner')
    }
  }, [monitorSeconds, soonestApp])

  const startCall = () => {
    setCallConnected(false)
    setCallPhase('calling')
  }

  const handleEnd = (seconds) => {
    setCallDuration(seconds)
    setCallPhase('summary')
  }

  if (callPhase === 'calling') {
    return (
      <PhoneFrame activity={callConnected ? 'active' : 'ringing'}>
        <InCall
          persona={callPersona}
          onEnd={handleEnd}
          onConnected={() => setCallConnected(true)}
        />
      </PhoneFrame>
    )
  }

  if (callPhase === 'summary') {
    return (
      <PhoneFrame>
        <Summary
          app={triggeredApp}
          duration={callDuration}
          onHome={() => {
            setMonitorSeconds(0)
            setTriggeredApp(null)
            setCallPhase('idle')
            setScreen('settings')
          }}
        />
      </PhoneFrame>
    )
  }

  return (
    <PhoneFrame
      onHomeGesture={() => setScreen('settings')}
      activity={
        callPhase === 'banner' || callPhase === 'fullscreen' ? 'ringing' : 'none'
      }
    >
      <div className="relative h-full w-full">
        {screen === 'settings' && (
          <MainSettings
            apps={apps}
            onOpenAppPicker={() => {
              setEditingApp(null)
              setScreen('apppicker')
            }}
            onEditApp={(app) => {
              setEditingApp(app)
              setScreen('apppicker')
            }}
            onTestCall={() => {
              setTriggeredApp(soonestApp)
              setCallPhase('banner')
            }}
          />
        )}

        {screen === 'apppicker' && (
          <AppPicker
            apps={apps}
            editingApp={editingApp}
            monitorSeconds={monitorSeconds}
            onConfirm={({ app: selected, limitMinutes, personaId, interests, plan }) => {
              setApps((prev) => {
                const record = { ...selected, limitMinutes, personaId, interests, plan }
                if (editingApp) {
                  return prev.map((a) => (a.id === editingApp.id ? record : a))
                }
                return [...prev, record]
              })
              setScreen('settings')
              setEditingApp(null)
            }}
            onDelete={(target) => {
              setApps((prev) => prev.filter((a) => a.id !== target.id))
              setEditingApp(null)
              setScreen('settings')
            }}
            onBack={() => {
              setEditingApp(null)
              setScreen('settings')
            }}
          />
        )}

        {callPhase === 'banner' && (
          <CallBanner
            persona={callPersona}
            onTapBanner={() => setCallPhase('fullscreen')}
            onAccept={startCall}
            onDecline={() => setCallPhase('idle')}
            onAutoDismiss={() => setCallPhase('idle')}
          />
        )}

        {callPhase === 'fullscreen' && (
          <div className="animate-fade-in absolute inset-0 z-40">
            <IncomingCall persona={callPersona} onAccept={startCall} onDecline={() => setCallPhase('idle')} />
          </div>
        )}
      </div>
    </PhoneFrame>
  )
}
