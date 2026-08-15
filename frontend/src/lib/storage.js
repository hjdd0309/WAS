// 온보딩 완료 여부와 선택 결과를 localStorage에 보존해 새로고침/재방문에도
// 온보딩을 다시 거치지 않도록 한다. 백엔드는 stateless라 이 상태는 전적으로
// 프론트(브라우저)가 들고 있어야 한다.
const STORAGE_KEY = 'was:v1'

// 로그인 없이 브라우저별로 하나씩 발급하는 익명 식별자. 서버에 프로필을
// 저장/조회할 때 x-user-id 헤더로 실어 보낸다 — QR로 들어온 관객/심사위원도
// 각자 별개 사용자로 자동 분리된다.
const USER_ID_KEY = 'was:userId'

export function getUserId() {
  if (typeof window === 'undefined') return ''
  let id = window.localStorage.getItem(USER_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem(USER_ID_KEY, id)
  }
  return id
}

const DEFAULT_ROUTINES = [
  { id: 'r1', label: '공모전 준비', color: '#ff9090' },
  { id: 'r2', label: '책읽기', color: '#511010' },
  { id: 'r3', label: '헬스장 가기', color: '#282c47' },
  { id: 'r4', label: '요리 연습', color: '#cbe291' },
  { id: 'r5', label: '수영', color: '#586deb' },
]

// 처음 방문했을 때 기록 화면이 텅 비어 보이지 않도록 "어제" 통화 2건만 시드로
// 깔아둔다. "오늘" 항목은 실제로 통화를 마쳐야만 쌓인다 — CallSplash 참고.
const DAY_MS = 24 * 60 * 60 * 1000
const seedNow = Date.now()
const DEFAULT_CALL_LOG = [
  {
    id: 'seed1',
    timestamp: seedNow - DAY_MS - 3 * 60 * 60 * 1000,
    personaId: 'tsundereBro',
    appId: 'kakaotalk',
    durationSeconds: 29,
    quote: '까칠하게 굴길래 저도 모르게 웃음이 났어요',
  },
  {
    id: 'seed2',
    timestamp: seedNow - DAY_MS - 8 * 60 * 60 * 1000,
    personaId: 'trainer',
    appId: 'youtube',
    durationSeconds: 51,
    quote: '오늘 운동 언제 갈 거냐고 다그쳤어요',
  },
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
  // callLog: [{ id, timestamp, personaId, appId, durationSeconds, quote }] — 실제로 마친
  // 통화가 여기 쌓인다. 기록/리포트 화면이 진짜 데이터를 보여주는 유일한 소스.
  callLog: DEFAULT_CALL_LOG,
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
