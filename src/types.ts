import type { PersonaId } from "./personas.ts";

export type Screen = "onboarding" | "feed" | "incoming-call" | "call" | "end" | "log";

export interface OnboardingData {
  interests: string[];
  plan: string;
  personaId: PersonaId;
}

export interface CallLine {
  speaker: "ai" | "user" | "user-hint";
  text: string;
  done?: boolean;
}
