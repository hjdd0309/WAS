# backend/ 작업 지침

이 폴더는 `wait-a-second` 프로젝트의 백엔드입니다. **`frontend/` 폴더는 건드리지 않습니다** — 프론트는 별도로 관리되며, 이 백엔드는 독립적으로 배포됩니다.

## 이 백엔드가 하는 일

프론트가 신호(사용자 관심사/계획/페르소나 선택)를 보내면, OpenAI Realtime API 세션을 즉시 발급해서 브라우저가 WebRTC로 OpenAI와 직접 붙어 AI가 먼저 말을 거는 통화를 시작할 수 있게 합니다.

**중요:** 실제 음성 스트림(WebRTC)은 브라우저 ↔ OpenAI가 직접 주고받습니다. 이 백엔드는 오디오를 중계하지 않고, 아래 한 가지만 담당합니다.

- `POST /api/call` — OpenAI에 보낼 `client_secret`(임시 토큰)을 발급. `OPENAI_API_KEY`가 브라우저에 노출되지 않도록 서버에서만 다룸. 요청으로 받은 `interests`/`plan`/`personaId`를 반영해 페르소나별 voice/system instructions를 조립해서 세션 생성 시 함께 넘김. `plan`은 통화 마무리 단계에서 "저번에 하려던 거 어떻게 됐어?"처럼 자연스럽게 되짚어 몰입을 깨는 용도로 프롬프트에 들어감 — 훈계가 아니라 대화 흐름으로 유도하는 게 설계 의도. 요청 body가 비어있는 필드는 `x-user-id` 헤더로 KV 프로필을 조회해 채운다(아래 "서버 메모리" 참고).
- `POST /api/call/summary` — 통화 종료 후 프론트가 뽑아낸 짧은 요약(`deriveSummary`)을 `x-user-id`로 KV에 저장. 다음 통화의 `previousSummary`로 자동 반영됨.
- `POST /api/profile`, `GET /api/profile` — `x-user-id`별 프로필(관심사/계획/페르소나/루틴) 저장·조회. 저장 시 다음 알림 문구를 비동기로 미리 생성해 캐싱한다(아래 참고).
- `POST /api/push/subscribe`, `POST /api/push/send` — 실제 PWA Web Push 구독 등록/발송. 아래 "푸시 알림" 참고.

ElevenLabs TTS 폴백(`/api/tts`)은 이번 스코프에서 제외 — OpenAI Realtime만 사용. 로직은 원래 프론트 레포의 `vite.config.ts` 미들웨어에 있던 것을 옮긴 것입니다 (`feature/persona-presets` 브랜치의 `src/personas.ts`, `src/realtimeInstructions.ts` 참고).

## 서버 메모리 (userid 기반, 로그인 없음)

로그인 없이 프론트가 `crypto.randomUUID()`로 만든 익명 ID를 `x-user-id` 헤더로 보낸다. `src/kv.ts`가 이 ID를 키로 `UserProfile`(관심사/계획/페르소나/루틴/이전 통화 요약/캐싱된 알림 문구/푸시 구독)을 Upstash Redis에 저장한다. `KV_REST_API_URL`/`KV_REST_API_TOKEN`(또는 `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`)이 없으면 in-memory `Map`으로 폴백해 로컬 개발은 그냥 되지만, **배포 전에는 반드시 Vercel 대시보드에서 Redis(Upstash) Marketplace 통합을 연결해야** 프로필이 재시작/인스턴스 간에 유지된다.

## 푸시 알림 (실제 PWA Web Push)

프론트(`frontend/public/sw.js`)에 이미 있던 로컬 알림 폴백 위에, 서버가 보내는 진짜 Web Push를 얹었다:

1. 프론트가 알림 권한을 받으면 `PushManager`로 구독을 만들고 `/api/push/subscribe`로 등록.
2. `/api/profile` 저장 시점마다 `src/notificationText.ts`가 저장된 프로필(관심사/계획/페르소나 톤)로 "친구가 보낸 것 같은" 짧은 문자 한 통을 미리 생성해 `pendingNotificationText`로 캐싱해둔다 — 발송 순간에 LLM 지연이 끼지 않게 하기 위함.
3. 프론트(`useAwayMonitor`)가 임계값 도달을 감지하면 `/api/push/send`를 호출 → 캐싱된 문구를 `web-push`로 즉시 발송하고, 응답 후 다음 번을 위한 문구를 백그라운드로 재생성.
4. `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`가 없으면 `/api/push/send`는 501을 반환하고, 프론트는 조용히 로컬 알림으로 폴백한다(오프라인/미배포 상황 대비).

키는 `npx web-push generate-vapid-keys`(backend/ 안에서 `web-push` 의존성 설치 후)로 로컬 생성 — 외부 호출 없는 순수 연산. 프론트의 `VITE_VAPID_PUBLIC_KEY`에는 반드시 같은 공개키를 넣어야 한다.

## 아키텍처 결정 사항

- **상태 없음(stateless), 짧은 요청만 처리** → Vercel Serverless Functions에 적합. 리얼타임 오디오 자체를 서버가 붙잡고 있지 않으므로 서버리스의 짧은 실행시간 제약(Hobby 플랜 기본 10초)에 걸리지 않음.
- Express 앱 하나(`src/app.ts`)로 라우트를 구성하고, `api/index.ts`가 이를 감싸 Vercel 함수 엔트리로 노출. 로컬 개발은 `src/server.ts`(`app.listen`)로 실행.
- Swagger UI(`/docs`)로 API 문서 제공. `swagger-jsdoc` 런타임 파싱 대신 **수동으로 작성한 OpenAPI 스펙 객체**를 사용 (컴파일 후 주석이 사라지는 문제, 서버리스 환경에서 소스 파일 경로 의존성 문제를 피하기 위함).
- 배포는 Vercel Hobby(무료) 플랜 기준으로 설계. 실제 서비스로 전환 시 Pro 플랜 필요 여부를 재검토할 것.

## 환경 변수

`backend/.env.example` 참고. `OPENAI_API_KEY`는 필수, 나머지(`FRONTEND_ORIGIN`, `APP_SHARED_SECRET`, `KV_REST_API_URL`/`TOKEN`, `VAPID_PUBLIC_KEY`/`PRIVATE_KEY` 등)는 배포 시 강력 권장 — 특히 KV/VAPID를 안 채우면 서버 메모리와 실제 푸시가 조용히 폴백 모드로 동작하니 배포 전 체크리스트에 넣을 것.

로컬에서 `.env` 파일로 값을 주는 경우, `src/server.ts`가 반드시 `import "dotenv/config"`를 다른 어떤 import보다 먼저 두고 있어야 한다 — tsx가 이 파일을 ESM으로 평가하는데, ESM은 import된 모듈들을 먼저 전부 평가한 뒤에야 그 파일 자신의 코드(예: `dotenv.config()` 호출)를 실행하므로, `kv.ts`/`push.ts`처럼 모듈 최상단에서 `process.env`를 읽는 코드가 dotenv보다 먼저 실행돼 값을 못 보는 순서 버그가 생기기 쉽다.

## 보안

Vercel이 주는 공개 URL은 CORS로 못 막는 직접 호출(curl/봇)에 노출됩니다. `FRONTEND_ORIGIN` 미설정 시 CORS는 전부 거부(allow-all 아님), `APP_SHARED_SECRET` 설정 시 헤더 `x-app-secret` 불일치면 401, IP당 분당 10회 rate limit, 입력 길이 제한(interests/plan/previousSummary) 걸려 있음. 자세한 내용은 `README.md`의 "보안 메모" 참고.

## 개인화 (DB 없이)

해커톤 데모가 목표라 실제 DB/사용자 인증은 만들지 않기로 함(심사에서 다회차 기억을 확인할 기회가 없다는 판단). 대신 `previousSummary`라는 선택 필드로 "여러 번 통화해도 기억하는" 느낌만 가볍게 구현:

- 프론트가 통화 종료 후 짧은 요약을 `localStorage`에 저장해뒀다가, 다음 통화 시작 시 `previousSummary`로 실어 보냄.
- 백엔드는 이 값을 저장하지 않고, 그 세션의 system instructions에 "예전 통화 기억" 섹션으로만 반영 (`realtimeInstructions.ts` 참고). 상태는 여전히 프론트(브라우저)가 들고 있으므로 백엔드는 계속 stateless.
- 나중에 실제 여러 사용자를 넘어 진짜 개인화(로그인, 다회차 기록 축적, 암호화 저장)가 필요해지면 이때 DB(Neon/Supabase 등) 도입을 재검토.

## 프론트와의 계약

엔드포인트는 `POST /api/call` (원래 프론트 vite 미들웨어의 `/api/realtime-session`에서 이름만 단순화됨 — 프론트가 이 백엔드를 실제로 호출하도록 연동할 때 `useRealtimeCall.ts`의 fetch 경로를 `/api/call`로 바꿔줘야 함).

요청: `{ interests: string[], plan: string, personaId: string, previousSummary?: string }`
응답: `{ client_secret: string, model: string }`

이 필드명/응답 형태를 바꾸면 프론트 쪽 수정이 함께 필요하므로, 변경 전 반드시 확인할 것.

`/api/profile`, `/api/call/summary`, `/api/push/*`는 전부 `x-user-id` 헤더가 필수다(없으면 400). `/api/call`은 이 헤더가 있으면 선택적으로 body를 KV 값으로 백필하지만, 헤더 자체는 필수가 아니다(기존 호환).
