// "dotenv/config"를 부수효과 전용 import로 먼저 둔다. tsx(esbuild)는 이 파일을
// ESM으로 평가하는데, ESM은 import 선언을 전부 먼저 인스턴시에이트한 뒤 그
// 그래프를 depth-first로 평가하므로 "import dotenv 후 dotenv.config() 호출" 순서로
// 써도 실제로는 뒤에 오는 import("./app", 그 아래 kv.ts/push.ts 등 모듈 최상단에서
// process.env를 읽는 코드)가 먼저 평가돼버려 .env 값을 못 본다. 부수효과를 다른
// 모듈(dotenv/config) 자신의 평가 시점으로 옮겨야 import 순서대로 실행이 보장된다.
import "dotenv/config";

import { createApp } from "./app";

const port = Number(process.env.PORT) || 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
  console.log(`swagger docs at http://localhost:${port}/docs`);
});
