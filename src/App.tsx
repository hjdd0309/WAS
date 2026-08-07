import { useState } from "react";
import PhoneFrame from "./components/PhoneFrame";
import OnboardingScreen from "./components/OnboardingScreen";
import FeedScreen from "./components/FeedScreen";
import IncomingCallScreen from "./components/IncomingCallScreen";
import CallScreen from "./components/CallScreen";
import EndScreen from "./components/EndScreen";
import LogScreen from "./components/LogScreen";
import { generateCallScript, type GeneratedCall } from "./script";
import { getPersona } from "./personas";
import type { OnboardingData, Screen } from "./types";

function App() {
  const [screen, setScreen] = useState<Screen>("onboarding");
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [call, setCall] = useState<GeneratedCall | null>(null);

  return (
    <PhoneFrame>
      {screen === "onboarding" && (
        <OnboardingScreen
          onComplete={(data) => {
            setOnboarding(data);
            setScreen("feed");
          }}
        />
      )}

      {screen === "feed" && onboarding && (
        <FeedScreen
          onTrigger={(swipeCount) => {
            setCall(generateCallScript(onboarding, swipeCount));
            setScreen("incoming-call");
          }}
        />
      )}

      {screen === "incoming-call" && onboarding && (
        <IncomingCallScreen
          persona={getPersona(onboarding.personaId)}
          onAccept={() => setScreen("call")}
          onDecline={() => setScreen("feed")}
        />
      )}

      {screen === "call" && call && onboarding && (
        <CallScreen onboarding={onboarding} call={call} onEnd={() => setScreen("end")} />
      )}

      {screen === "end" && (
        <EndScreen
          onBackToFeed={() => setScreen("feed")}
          onShowLog={() => setScreen("log")}
        />
      )}

      {screen === "log" && call && (
        <LogScreen reasoning={call.reasoning} onBack={() => setScreen("end")} />
      )}
    </PhoneFrame>
  );
}

export default App;
