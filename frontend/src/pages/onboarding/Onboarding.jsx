import { useState } from 'react'
import { DEFAULT_PERSONA_ID } from '../../personas'
import OnboardingIntro from './OnboardingIntro'
import OnboardingInfo from './OnboardingInfo'
import OnboardingGoal from './OnboardingGoal'
import OnboardingSetup from './OnboardingSetup'
import OnboardingPersonalize from './OnboardingPersonalize'
import OnboardingInstall from './OnboardingInstall'
import OnboardingReady from './OnboardingReady'
import onboarding2Character from '../../assets/illustrations/onboarding2-character.png'
import onboarding2Widget from '../../assets/illustrations/onboarding2-widget.png'
import onboarding3Character from '../../assets/illustrations/onboarding3-character.png'
import onboarding3Widget from '../../assets/illustrations/onboarding3-widget.png'

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
            characterSrc={onboarding2Character}
            characterWidth={178}
            characterRight={-20}
            characterBottom={16}
            widgetSrc={onboarding2Widget}
            widgetWidth={212}
            widgetTop={1}
            widgetLeft={11}
            cardWidth={260}
            cardHeight={293}
            widgetBehindCharacter
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
            characterSrc={onboarding3Character}
            characterWidth={165}
            characterRight={19}
            characterBottom={0}
            widgetSrc={onboarding3Widget}
            widgetWidth={226}
            widgetTop={12}
            widgetLeft={0}
            cardWidth={260}
            cardHeight={360}
            slotHeight={293}
            heading="함께 패턴을 보고"
            headingAccent="스스로를 알아가요"
            description={
              <>
                주간 리포트로 사용 패턴을 확인하고,
                <br />
                필요하면 가족,친구와
                <br />
                선택적으로 공유할 수 있어요.
              </>
            }
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
