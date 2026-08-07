import { useEffect } from "react";
import type { GeneratedCall } from "../script";
import type { OnboardingData } from "../types";
import { getPersona } from "../personas";
import { useRealtimeCall } from "../useRealtimeCall";
import CallScreenRealtime from "./CallScreenRealtime";
import CallScreenScripted from "./CallScreenScripted";

export default function CallScreen({
  onboarding,
  call,
  onEnd,
}: {
  onboarding: OnboardingData;
  call: GeneratedCall;
  onEnd: () => void;
}) {
  const persona = getPersona(onboarding.personaId);
  const realtime = useRealtimeCall(onboarding);

  useEffect(() => {
    realtime.connect();
    return () => {
      realtime.hangup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (realtime.status === "unavailable" || realtime.status === "error") {
    return <CallScreenScripted persona={persona} lines={call.lines} onEnd={onEnd} />;
  }

  return <CallScreenRealtime persona={persona} call={realtime} onEnd={onEnd} />;
}
