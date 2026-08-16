import dotenv from "dotenv";

// .env.local(신경 안 쓰고 로컬에서만 실제 값을 채워 넣는 파일, git에는 올라가지
// 않음)이 있으면 .env 위에 덮어쓴다 — Next.js의 .env.local 관례와 동일. 이 모듈은
// server.ts에서 다른 어떤 import보다 먼저 import 되어야 한다 (kv.ts/push.ts처럼
// 모듈 최상단에서 process.env를 읽는 코드보다 먼저 실행되어야 하므로).
dotenv.config();
dotenv.config({ path: ".env.local", override: true });
