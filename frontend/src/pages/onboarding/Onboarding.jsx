import { useState } from 'react'
import { DEFAULT_PERSONA_ID } from '../../personas'
import OnboardingIntro from './OnboardingIntro'
import OnboardingInfo from './OnboardingInfo'
import OnboardingGoal from './OnboardingGoal'
import OnboardingSetup from './OnboardingSetup'
import OnboardingPersonalize from './OnboardingPersonalize'
import OnboardingInstall from './OnboardingInstall'
import OnboardingReady from './OnboardingReady'

// 컨테이너 크기를 onboarding-composite.png 안 해당 카드의 실제 픽셀 크기와 동일하게 맞춰서
// (1:1 스케일) 카드가 잘리지 않고 원본 그대로 보이게 한다.
// STEP2는 짧은 화면(예: 갤럭시 S8)에서 스크롤 없이 다 보이도록, 검증된 크롭 영역(좌상단
// -395px/-231px 기준)을 그대로 유지한 채 0.72배로 균일 축소한다 — 카드가 화면에서 차지하는
// 절대 크기만 줄고, 카드 안에서 보여주는 영역·비율은 이전과 완전히 동일하다.
const STEP2_SCALE = 0.72
const STEP2_CROP = {
  containerW: Math.round(261 * STEP2_SCALE),
  containerH: Math.round(402 * STEP2_SCALE),
  w: `${Math.round(1381 * STEP2_SCALE)}px`,
  h: `${Math.round(1139 * STEP2_SCALE)}px`,
  left: `${Math.round(-395 * STEP2_SCALE)}px`,
  top: `${Math.round(-231 * STEP2_SCALE)}px`,
}
const STEP2_SLOT = { width: STEP2_CROP.containerW, height: STEP2_CROP.containerH }
const STEP3_CROP = { containerW: 250, containerH: 400, w: '443.69%', h: '228.71%', left: '-331.44%', top: '-36.75%' }
const STEP3_SLOT = { width: 250, height: 400 }

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [selectedGoals, setSelectedGoals] = useState([])
  const [selectedAppId, setSelectedAppId] = useState('youtube')
  const [limitMinutes, setLimitMinutes] = useState(45)
  const [personaId, setPersonaId] = useState(DEFAULT_PERSONA_ID)
  const [interests, setInterests] = useState([])
  const [plan, setPlan] = useState('')

  const toggleGoal = (goal) =>
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    )

  const next = () => setStep((s) => Math.min(7, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  const finish = () =>
    onComplete({
      goals: selectedGoals,
      appId: selectedAppId,
      limitMinutes,
      personaId,
      interests,
      plan,
    })

  return (
    <div className="flex h-full w-full flex-col bg-[#1b171c]">
      <div className="min-h-0 flex-1 pt-6">
        {step === 0 && <OnboardingIntro onNext={next} />}
        {step === 1 && (
          <OnboardingInfo
            crop={STEP2_CROP}
            slotSize={STEP2_SLOT}
            heading="정한 시간을 넘으면"
            headingAccent="위스피가 당신에게 찾아가요"
            description={
              <>
                설정한 시간을 넘으면
                <br />
                AI 알림으로 가볍게 안내해드려요.
                <br />
                매번 다르게, 지금 당신에게
                <br />
                필요한 말을 건넬게요
              </>
            }
            activeIndex={1}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 2 && (
          <OnboardingInfo
            crop={STEP3_CROP}
            slotSize={STEP3_SLOT}
            heading="함께 패턴을 보고"
            headingAccent="스스로를 알아가요"
            headingSizeClass="text-[29px]"
            description={
              <>
                주간 리포트로 사용 패턴을 확인하고,
                <br />
                필요하면 가족,친구와
                <br />
                선택적으로 공유할 수 있어요.
              </>
            }
            descriptionSizeClass="text-[18px]"
            descriptionMinHeight={95}
            activeIndex={2}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 3 && (
          <OnboardingGoal
            selectedGoals={selectedGoals}
            onToggleGoal={toggleGoal}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 4 && (
          <OnboardingSetup
            selectedAppId={selectedAppId}
            onSelectApp={setSelectedAppId}
            limitMinutes={limitMinutes}
            onChangeLimit={setLimitMinutes}
            personaId={personaId}
            onSelectPersona={setPersonaId}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 5 && (
          <OnboardingPersonalize
            interests={interests}
            onChangeInterests={setInterests}
            plan={plan}
            onChangePlan={setPlan}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 6 && <OnboardingInstall onBack={back} onNext={next} />}
        {step === 7 && <OnboardingReady onComplete={finish} />}
      </div>
    </div>
  )
}
