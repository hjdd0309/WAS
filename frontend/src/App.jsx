import { useEffect, useRef, useState } from 'react'
import PhoneFrame from './components/PhoneFrame'
import CallBanner from './components/CallBanner'
import MainSettings from './pages/MainSettings'
import AppPicker from './pages/AppPicker'
import IncomingCall from './pages/IncomingCall'
import InCall from './pages/InCall'
import Summary from './pages/Summary'

export default function App() {
  // screen: 지금 보고 있는 화면 (settings | apppicker)
  const [screen, setScreen] = useState('settings')
  // callPhase: 화면 위에 얹히는 전화 상태 (idle | banner | fullscreen | calling | summary)
  const [callPhase, setCallPhase] = useState('idle')

  const [apps, setApps] = useState([])
  const [voiceId, setVoiceId] = useState('mom')
  const [editingApp, setEditingApp] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [callConnected, setCallConnected] = useState(false)

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
    if (!apps[0] || firedRef.current) return
    const limitSeconds = apps[0].limitMinutes * 60
    if (monitorSeconds >= limitSeconds) {
      firedRef.current = true
      setCallPhase('banner')
    }
  }, [monitorSeconds, apps])

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
        <InCall onEnd={handleEnd} onConnected={() => setCallConnected(true)} />
      </PhoneFrame>
    )
  }

  if (callPhase === 'summary') {
    return (
      <PhoneFrame>
        <Summary
          app={apps[0]}
          duration={callDuration}
          onHome={() => {
            setMonitorSeconds(0)
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
            onTestCall={() => setCallPhase('banner')}
          />
        )}

        {screen === 'apppicker' && (
          <AppPicker
            apps={apps}
            editingApp={editingApp}
            initialVoiceId={voiceId}
            monitorSeconds={monitorSeconds}
            onConfirm={({ app: selected, limitMinutes, voiceId: voice }) => {
              setVoiceId(voice)
              setApps((prev) => {
                const record = { ...selected, limitMinutes }
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
            onTapBanner={() => setCallPhase('fullscreen')}
            onAccept={startCall}
            onDecline={() => setCallPhase('idle')}
            onAutoDismiss={() => setCallPhase('idle')}
          />
        )}

        {callPhase === 'fullscreen' && (
          <div className="animate-fade-in absolute inset-0 z-40">
            <IncomingCall onAccept={startCall} onDecline={() => setCallPhase('idle')} />
          </div>
        )}
      </div>
    </PhoneFrame>
  )
}
