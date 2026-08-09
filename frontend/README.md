# WAS frontend

AI가 전화로 개입해 스마트폰 중독을 끊어주는 서비스, WAS(Wait A Second)의 프론트엔드입니다.
아이폰 목업(`PhoneFrame`) 안에서 앱 사용 시간 설정 → 전화 수신 → 실제 AI 음성 통화 → 통화 요약까지의
전체 흐름을 구현합니다.

## 실행

```bash
npm install
npm run dev
```

## 실제 AI 통화가 동작하려면

이 프론트는 `backend/`(별도 배포되는 Vercel 서버리스 프로젝트)가 발급하는 임시 토큰으로
브라우저 ↔ OpenAI Realtime API 사이에 WebRTC 통화를 직접 맺습니다. `.env.example`을 `.env`로
복사한 뒤 값을 채워주세요.

```bash
cp .env.example .env
```

- `VITE_API_BASE_URL` — 백엔드 배포 URL (로컬에서 `backend`를 `npm run dev`로 띄웠다면 기본값 그대로 사용)
- `VITE_APP_SHARED_SECRET` — 백엔드에 `APP_SHARED_SECRET`을 설정했다면 동일한 값

값을 채우지 않으면 통화 화면이 "연결에 실패했어요" 상태로 떨어지며, "다시 시도" 버튼으로
재시도할 수 있습니다(마이크 권한 거부, 백엔드 미기동 등도 같은 방식으로 처리됩니다).

## 주요 흐름

- `MainSettings` — 감시할 앱/시간 제한 설정, AI 페르소나 확인
- `AppPicker` — 앱 추가/편집 + 시간 제한 + AI 통화 설정(페르소나·관심사·계획)
- `CallBanner` → `IncomingCall` → `InCall` — 배너/전체화면 수신 → 실제 음성 통화
- `Summary` — 통화 종료 후 요약, 다음 통화의 "기억"으로 로컬에 저장

앱 목록·AI 통화 설정은 `localStorage`(`src/lib/storage.js`)에 저장되어 새로고침해도 유지됩니다.
백엔드는 상태를 저장하지 않으므로(stateless) 여러 번 통화해도 "기억하는" 느낌은 이 로컬 저장 +
`previousSummary` 필드로만 구현됩니다.

## 페르소나

`src/personas.js`의 id는 `backend/src/personas.ts`와 반드시 일치해야 합니다. 통화 중에는 이
이름이 실제 발신자 이름으로 보이며, "AI"나 서비스명은 통화 화면에 노출하지 않습니다 — 친구가
건 전화처럼 느껴지게 하는 것이 핵심 설계 의도입니다.
