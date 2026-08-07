# Wait A Second (여보세요)

숏폼 콘텐츠를 오래 보고 있으면, 친구(페르소나)가 전화를 걸어와 잠깐 다른 얘기를 하다 끊는 웹 데모입니다. React + Vite 프론트엔드와, OpenAI Realtime API / ElevenLabs TTS를 프록시하는 Vite 미들웨어로 구성되어 있습니다.

## 요구 사항

- Node.js 20+
- OpenAI API 키 (Realtime API 접근 가능한 키)
- ElevenLabs API 키 (선택 — 없으면 브라우저 내장 TTS로 폴백)

## 로컬 실행 런북

1. 의존성 설치

   ```bash
   npm install
   ```

2. 환경 변수 설정

   `.env.example`을 복사해 `.env`를 만들고 값을 채웁니다.

   ```bash
   cp .env.example .env
   ```

   | 변수 | 필수 | 설명 |
   | --- | --- | --- |
   | `OPENAI_API_KEY` | 필수 | Realtime API 세션 발급에 사용. 없으면 통화가 항상 대본+TTS 모드로 폴백됩니다. |
   | `REALTIME_MODEL` | 선택 | 기본값 `gpt-realtime` (GA 모델). 구버전 preview 모델명은 더 이상 지원되지 않습니다. |
   | `ELEVENLABS_API_KEY` | 선택 | 대본 폴백 모드의 TTS. 없으면 브라우저 `speechSynthesis`로 대체됩니다. |
   | `ELEVENLABS_VOICE_ID` | 선택 | 기본값 `21m00Tcm4TlvDq8ikWAM`. |

3. 개발 서버 실행

   ```bash
   npm run dev
   ```

   기본 포트는 5173이며, 이미 사용 중이면 Vite가 자동으로 다음 포트(5174, 5175...)를 사용합니다. 터미널에 출력된 `Local:` URL로 접속하세요.

   > 마이크 권한은 브라우저 origin(포트 포함) 단위로 저장됩니다. 포트가 바뀌면 마이크 권한을 다시 허용해야 realtime 통화가 붙습니다.

4. 브라우저에서 온보딩 → 관심사/페르소나 선택 → 피드 화면에서 위로 스와이프(또는 좌하단 "데모: 바로 전화 걸기") → 전화 받기

5. 빌드 확인 (배포 전)

   ```bash
   npm run build
   ```

## 아키텍처 메모

- `vite.config.ts`의 커스텀 미들웨어(`/api/realtime-session`, `/api/tts`)가 브라우저 대신 OpenAI/ElevenLabs API 키를 다뤄, 클라이언트에 시크릿이 노출되지 않게 합니다.
- Realtime 통화가 실패(세션 발급 실패, WebRTC 연결 실패, 마이크 미허용 등)하면 `CallScreen.tsx`가 자동으로 `CallScreenScripted`(사전 정의 대본 + TTS) 모드로 폴백합니다.
- 페르소나 프리셋은 `src/personas.ts`에 정의되어 있으며, 온보딩 화면에서 선택한 페르소나에 따라 realtime 세션의 목소리와 시스템 프롬프트 톤이 달라집니다.
