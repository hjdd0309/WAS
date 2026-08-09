import CallActionButton from '../components/CallActionButton'
import StatusBar from '../components/StatusBar'

export default function IncomingCall({ onAccept, onDecline }) {
  return (
    <div className="flex h-full w-full flex-col justify-between bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] px-8 pb-10 pt-3">
      <StatusBar />

      <div className="flex flex-col items-center gap-2">
        <p className="text-[15px] text-white/60">휴대전화</p>
        <p className="text-[32px] font-bold text-white">WAS AI</p>
      </div>

      <div className="flex items-center justify-between px-4">
        <CallActionButton type="decline" label="거절" onClick={onDecline} />
        <CallActionButton type="accept" label="받기" onClick={onAccept} />
      </div>
    </div>
  )
}
