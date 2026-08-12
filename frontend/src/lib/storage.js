// 온보딩 완료 여부와 선택 결과를 localStorage에 보존해 새로고침/재방문에도
// 온보딩을 다시 거치지 않도록 한다. 백엔드는 stateless라 이 상태는 전적으로
// 프론트(브라우저)가 들고 있어야 한다.
const STORAGE_KEY = 'was:v1'

const DEFAULT_ROUTINES = [
  { id: 'r1', label: '공모전 준비', color: '#ff9090' },
  { id: 'r2', label: '책읽기', color: '#511010' },
  { id: 'r3', label: '헬스장 가기', color: '#282c47' },
  { id: 'r4', label: '요리 연습', color: '#cbe291' },
  { id: 'r5', label: '수영', color: '#586deb' },
]

const defaultState = {
  onboarded: false,
  goals: [],
  // apps: [{ id, appId, limitMinutes, personaId }] — 앱마다 따로 목소리/시간을 둘 수 있다.
  apps: [],
  interests: [],
  plan: '',
  previousSummary: '',
  routines: DEFAULT_ROUTINES,
}

export function loadState() {
  if (typeof window === 'undefined') return defaultState
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw)
    const merged = { ...defaultState, ...parsed }

    // 예전 버전은 앱 1개(appId/limitMinutes/personaId)만 저장했다 —
    // apps 배열로 옮겨서 기존 사용자의 설정이 날아가지 않게 한다.
    if (!Array.isArray(merged.apps) || merged.apps.length === 0) {
      if (parsed.appId) {
        merged.apps = [
          {
            id: 'legacy',
            appId: parsed.appId,
            limitMinutes: parsed.limitMinutes ?? 45,
            personaId: parsed.personaId ?? null,
          },
        ]
      }
    }

    return merged
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
