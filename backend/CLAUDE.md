# backend/ 작업 지침

이 폴더는 `wait-a-second` 프로젝트의 백엔드입니다. **`frontend/` 폴더는 건드리지 않습니다** — 프론트는 별도로 관리되며, 이 백엔드는 독립적으로 배포됩니다.

## 이 백엔드가 하는 일

프론트가 신호(사용자 관심사/계획/페르소나 선택)를 보내면, OpenAI Realtime API 세션을 즉시 발급해서 브라우저가 WebRTC로 OpenAI와 직접 붙어 AI가 먼저 말을 거는 통화를 시작할 수 있게 합니다.

**중요:** 실제 음성 스트림(WebRTC)은 브라우저 ↔ OpenAI가 직접 주고받습니다. 이 백엔드는 오디오를 중계하지 않고, 아래 한 가지만 담당합니다.

- `POST /api/call` — OpenAI에 보낼 `client_secret`(임시 토큰)을 발급. `OPENAI_API_KEY`가 브라우저에 노출되지 않도록 서버에서만 다룸. 요청으로 받은 `interests`/`plan`/`personaId`를 반영해 페르소나별 voice/system instructions를 조립해서 세션 생성 시 함께 넘김. `plan`은 통화 마무리 단계에서 "저번에 하려던 거 어떻게 됐어?"처럼 자연스럽게 되짚어 몰입을 깨는 용도로 프롬프트에 들어감 — 훈계가 아니라 대화 흐름으로 유도하는 게 설계 의도.

ElevenLabs TTS 폴백(`/api/tts`)은 이번 스코프에서 제외 — OpenAI Realtime만 사용. 로직은 원래 프론트 레포의 `vite.config.ts` 미들웨어에 있던 것을 옮긴 것입니다 (`feature/persona-presets` 브랜치의 `src/personas.ts`, `src/realtimeInstructions.ts` 참고).

## 아키텍처 결정 사항

- **상태 없음(stateless), 짧은 요청만 처리** → Vercel Serverless Functions에 적합. 리얼타임 오디오 자체를 서버가 붙잡고 있지 않으므로 서버리스의 짧은 실행시간 제약(Hobby 플랜 기본 10초)에 걸리지 않음.
- Express 앱 하나(`src/app.ts`)로 라우트를 구성하고, `api/index.ts`가 이를 감싸 Vercel 함수 엔트리로 노출. 로컬 개발은 `src/server.ts`(`app.listen`)로 실행.
- Swagger UI(`/docs`)로 API 문서 제공. `swagger-jsdoc` 런타임 파싱 대신 **수동으로 작성한 OpenAPI 스펙 객체**를 사용 (컴파일 후 주석이 사라지는 문제, 서버리스 환경에서 소스 파일 경로 의존성 문제를 피하기 위함).
- 배포는 Vercel Hobby(무료) 플랜 기준으로 설계. 실제 서비스로 전환 시 Pro 플랜 필요 여부를 재검토할 것.

## 환경 변수

`backend/.env.example` 참고. `OPENAI_API_KEY`는 필수, 나머지(`FRONTEND_ORIGIN`, `APP_SHARED_SECRET` 등)는 배포 시 강력 권장.

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
