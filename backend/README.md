# backend

프론트가 신호를 보내면 OpenAI Realtime API용 임시 토큰을 발급하는 서버. 실제 음성(WebRTC)은 브라우저가 그 토큰으로 OpenAI와 직접 연결하며, 이 서버는 통화 스트림을 중계하지 않는다.

## 로컬 실행

```bash
npm install
cp .env.example .env   # OPENAI_API_KEY 채우기
npm run dev
```

- API: `http://localhost:3000/api/call`
- Swagger UI: `http://localhost:3000/docs`
- 헬스체크: `http://localhost:3000/health`

## API

### `POST /api/call`

요청 바디:

```json
{
  "interests": ["영화", "러닝"],
  "plan": "오늘 저녁까지 과제 제출하기",
  "personaId": "bestie",
  "previousSummary": "지난번엔 다음 주 러닝 대회 나간다고 했었음"
}
```

`previousSummary`는 선택 필드. DB 없이 "여러 번 통화해도 기억하는" 느낌을 주기 위한 것으로, 프론트가 통화 종료 후 짧은 요약을 `localStorage`에 저장해뒀다가 다음 통화 시작 시 실어 보내면 된다. 백엔드는 이걸 저장하지 않고 그 세션의 프롬프트에만 반영한다 (최대 500자).

응답:

```json
{ "client_secret": "...", "model": "gpt-realtime" }
```

프론트는 이 `client_secret`으로 `https://api.openai.com/v1/realtime/calls`에 WebRTC offer를 보내 직접 연결한다 (`useRealtimeCall.ts` 참고).

## 배포 (Vercel, 무료 Hobby 플랜)

이 서버는 상태 없이 짧은 요청만 처리하므로 Vercel Serverless Functions에 그대로 올라간다.

1. 이 `backend/` 폴더를 별도 Vercel 프로젝트로 연결 (Root Directory를 `backend`로 지정).
2. 환경변수에 `OPENAI_API_KEY`, `REALTIME_MODEL`, `REALTIME_VOICE`, `FRONTEND_ORIGIN`(프론트 배포 origin), `APP_SHARED_SECRET` 설정.
3. 배포하면 `api/index.ts`가 Express 앱을 서버리스 함수로 노출하고, `vercel.json`의 rewrite가 모든 요청을 그 함수로 보낸다.
4. Hobby 플랜은 무료지만 함수 실행시간이 기본 10초로 제한된다. 이 서버는 짧은 토큰 발급 요청만 처리하므로 문제없다.

## 보안 메모

Vercel은 `xxx.vercel.app` 같은 공개 URL을 주기 때문에, 그 URL만 알면 프론트를 거치지 않고 누구나 직접 `/api/call`을 호출해 내 `OPENAI_API_KEY`로 세션을 만들어낼 수 있다 (CORS는 브라우저만 막고 curl/봇은 못 막음). 그래서 다음을 기본으로 넣어뒀다:

- **CORS 화이트리스트**: `FRONTEND_ORIGIN` 미설정 시 모든 브라우저 origin을 거부(allow-all이 아님). 배포 전 반드시 설정.
- **공유 시크릿**: `APP_SHARED_SECRET` 설정 시 요청 헤더 `x-app-secret`이 일치해야 통과. 프론트 번들에 박히는 값이라 devtools로 보면 노출되므로 진짜 인증은 아니고, URL만 우연히 찾은 스캐너/봇을 막는 최소 장치.
- **Rate limit**: IP당 분당 10회로 제한 (`express-rate-limit`) — 세션 발급 남용으로 인한 OpenAI 비용/쿼터 소진 방지.
- **입력 검증**: `interests` 최대 10개(각 30자), `plan` 최대 200자, `personaId`는 정의된 값만 허용 — 프롬프트 인젝션/과금 목적의 과도한 페이로드 방지.
- **에러 메시지 정리**: OpenAI 업스트림 에러 원문은 서버 로그에만 남기고, 클라이언트에는 일반화된 메시지만 반환.

실제 사용자 인증(로그인)까지 필요해지면 이 시크릿 방식은 교체해야 한다.
