// 온보딩 완료 여부와 선택 결과를 localStorage에 보존해 새로고침/재방문에도
// 온보딩을 다시 거치지 않도록 한다. 백엔드는 stateless라 이 상태는 전적으로
// 프론트(브라우저)가 들고 있어야 한다.
const STORAGE_KEY = 'was:v1'

const defaultState = {
  onboarded: false,
  goals: [],
  appId: 'youtube',
  limitMinutes: 45,
  personaId: null,
}

export function loadState() {
  if (typeof window === 'undefined') return defaultState
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw)
    return { ...defaultState, ...parsed }
  } catch {
    return defaultState
  }
}

export function saveState(state) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 저장 공간이 꽉 찼거나 프라이빗 모드 등으로 실패해도 앱 동작에는 지장 없음
  }
}
