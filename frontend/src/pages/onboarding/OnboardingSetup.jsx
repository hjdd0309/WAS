import PillButton from '../../components/PillButton'
import ProgressDots from '../../components/ProgressDots'
import MonitorSetupForm from '../../components/MonitorSetupForm'

export default function OnboardingSetup({
  selectedAppId,
  onSelectApp,
  limitMinutes,
  onChangeLimit,
  personaId,
  onSelectPersona,
  onNext,
}) {
  return (
    <div className="flex h-full flex-col px-6 pb-8 pt-6">
      <h1 className="text-[26px] font-semibold leading-[1.35] text-white">
        어디에서 가장
        <br />
        시간을 많이 쓰나요?
      </h1>

      <div className="no-scrollbar mt-6 min-h-0 flex-1 overflow-y-auto">
        <MonitorSetupForm
          selectedAppId={selectedAppId}
          onSelectApp={onSelectApp}
          limitMinutes={limitMinutes}
          onChangeLimit={onChangeLimit}
          personaId={personaId}
          onSelectPersona={onSelectPersona}
        />
      </div>

      <div className="flex flex-col gap-6 pt-4">
        <ProgressDots total={6} activeIndex={4} />
        <PillButton disabled={!selectedAppId} onClick={onNext}>
          다음
        </PillButton>
      </div>
    </div>
  )
}
