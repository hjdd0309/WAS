export interface TestState {
  turn: number;
  plan: string;
  redirectTurn: number | null;
  endCallTurn: number | null;
}

export function createTestState(plan: string): TestState {
  return { turn: 0, plan, redirectTurn: null, endCallTurn: null };
}

// plan 문장의 단어가 응답에 등장하면 "재정향(3번)이 실제로 일어났다"는 대략적인
// 신호로 본다 — 정확한 의미 판별은 아니지만, 재정향을 완전히 빼먹는 실수를
// 잡아내는 용도로는 충분하다.
export function checkRedirect(text: string, state: TestState) {
  if (state.redirectTurn !== null || !state.plan) return;
  const keywords = state.plan.split(/\s+/).filter((w) => w.length >= 2);
  if (keywords.length > 0 && keywords.some((k) => text.includes(k))) {
    state.redirectTurn = state.turn;
    console.log(`\n[체크] 재정향 감지됨 (턴 ${state.turn}) — plan 키워드 언급됨\n`);
  }
}

export function checkEndCall(state: TestState) {
  if (state.endCallTurn !== null) {
    console.log(`\n[체크] end_call이 두 번째로 호출됨 (턴 ${state.turn}) — 원래 정확히 한 번만 불려야 함\n`);
    return;
  }
  state.endCallTurn = state.turn;
  console.log(`\n[체크] end_call 호출 감지 (턴 ${state.turn})\n`);
}

export function printSummary(state: TestState) {
  console.log("\n--- 요약 ---");
  console.log(`재정향: ${state.redirectTurn !== null ? `감지됨 (턴 ${state.redirectTurn})` : "감지 안 됨"}`);
  console.log(`end_call: ${state.endCallTurn !== null ? `호출됨 (턴 ${state.endCallTurn})` : "호출 안 됨"}`);
}
