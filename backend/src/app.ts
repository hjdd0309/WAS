import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { callRouter } from "./routes/call";
import { profileRouter } from "./routes/profile";
import { pushRouter } from "./routes/push";
import { openApiSpec } from "./swagger";
import { requireAppSecret } from "./appSecret";

export function createApp() {
  const app = express();

  // Vercel gives this an arbitrary public URL — CORS only stops browsers,
  // not direct curl/bot traffic, so it must not silently allow-all in prod.
  const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    console.warn(
      "FRONTEND_ORIGIN not set — CORS will reject all browser origins. Set it before deploying.",
    );
  }

  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: "10kb" }));

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  const callLimiter = rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // 프로필 저장/알림 문구 미리보기는 OpenAI 비용이 거의 없는 nano 모델 호출이라
  // (설정 화면 저장, 알림 문구 데모 버튼 등에서 자주 호출될 수 있음), call과 같은
  // 엄격한 리밋을 걸면 정상 사용/시연도 막힐 수 있어 훨씬 널널하게 둔다.
  const profileLimiter = rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // OPENAI_API_KEY usage happens behind this route, so it needs both a cost
  // guardrail (rate limit) and a barrier against random URL scanners
  // (shared secret) — CORS alone doesn't cover non-browser callers.
  app.use("/api", callLimiter, requireAppSecret, callRouter);
  app.use("/api", profileLimiter, requireAppSecret, profileRouter);
  app.use("/api", profileLimiter, requireAppSecret, pushRouter);

  return app;
}
