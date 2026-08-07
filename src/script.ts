import type { CallLine, OnboardingData } from "./types.ts";

const EPISODE_TEMPLATES: Array<(interest?: string) => string> = [
  () => "팀플하다가 완전 어이없는 일 있었던 거",
  (interest) => (interest ? `${interest} 관련해서 요즘 완전 꽂힌 거 생겼는데` : "요즘 꽂힌 거 생겼는데"),
  () => "어제 버스에서 완전 웃긴 거 봤는데",
];

const TRANSITION_LINES = [
  "아 근데 그거 말고, 너 요즘 밥은 잘 챙겨 먹고 다녀?",
  "그건 그렇고, 요즘 잠은 좀 잘 자?",
  "아 맞다, 너 요즘 날씨 너무 덥지 않아? 밖에 좀 나갔다 왔어?",
];

const TRANSITION_FOLLOWUPS = [
  "밥 잘 챙겨 먹어야 돼, 진짜.",
  "잠 부족하면 진짜 힘들더라, 나도 요즘 그래.",
  "그니까 날씨 핑계로 집에만 있지 말고 좀 걸어.",
];

function buildClosingA(): CallLine[] {
  return [
    { speaker: "ai", text: "아 나 이제 가봐야겠다." },
    { speaker: "ai", text: "근데 너는 이제 뭐 할 거야?" },
  ];
}

function buildClosingB(plan: string): CallLine[] {
  return [
    { speaker: "ai", text: `참, 너 저번에 ${plan} 한다고 하지 않았어?` },
    { speaker: "ai", text: "어떻게 됐어?" },
  ];
}

export interface GeneratedCall {
  lines: CallLine[];
  reasoning: {
    interestUsed?: string;
    closingVersion: "A" | "B";
    triggerSummary: string;
  };
}

export function generateCallScript(data: OnboardingData, swipeCount: number): GeneratedCall {
  const interest = data.interests[Math.floor(Math.random() * data.interests.length)];
  const episodeFn = EPISODE_TEMPLATES[Math.floor(Math.random() * EPISODE_TEMPLATES.length)];
  const episode = episodeFn(interest);

  const transitionIdx = Math.floor(Math.random() * TRANSITION_LINES.length);

  const opening: CallLine[] = [
    { speaker: "ai", text: "어 나야." },
    { speaker: "ai", text: `별건 아니고, 나 오늘 ${episode} 얘기하고 싶어서 전화했어.` },
  ];

  const transition: CallLine[] = [
    { speaker: "ai", text: TRANSITION_LINES[transitionIdx] },
    { speaker: "ai", text: TRANSITION_FOLLOWUPS[transitionIdx] },
  ];

  const useClosingB = Boolean(data.plan) && Math.random() < 0.5;
  const closing = useClosingB ? buildClosingB(data.plan) : buildClosingA();

  return {
    lines: [...opening, ...transition, ...closing],
    reasoning: {
      interestUsed: interest,
      closingVersion: useClosingB ? "B" : "A",
      triggerSummary: `연속 스와이프 ${swipeCount}회 감지 (다른 조작 없이 콘텐츠만 소비 중인 상태로 판단)`,
    },
  };
}
