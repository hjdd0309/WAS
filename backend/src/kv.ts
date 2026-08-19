import { Redis } from "@upstash/redis";
import type { UserProfile } from "./types";

const KEY_PREFIX = "was:profile:";

// Upstash Redis는 Vercel 프로젝트에 Marketplace 통합(Storage → Redis)을 연결해야만
// 붙는다. 연결하면 두 세대 이름 중 하나로 env var가 주입되는데(구: KV_REST_API_*,
// 신: UPSTASH_REDIS_REST_*) 둘 다 지원한다. 로컬 개발이나 그 설정 전에는
// in-memory Map으로 폴백해 `npm run dev`가 클라우드 설정 없이 바로 동작하게 한다 —
// 단, 이 폴백은 서버리스 인스턴스마다 따로 살고 재시작하면 날아가므로 실제
// 배포에서는 반드시 Upstash를 연결해야 한다.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

if (!redis) {
  console.warn(
    "[kv] KV_REST_API_URL/TOKEN (or UPSTASH_REDIS_REST_URL/TOKEN) not set — using in-memory profile store. " +
      "OK for local dev; profiles will NOT persist in production until Upstash Redis is connected.",
  );
}

const memoryStore = new Map<string, UserProfile>();

export async function getProfile(userId: string): Promise<UserProfile | null> {
  if (redis) {
    const value = await redis.get<UserProfile>(KEY_PREFIX + userId);
    return value ?? null;
  }
  return memoryStore.get(userId) ?? null;
}

export async function saveProfile(
  userId: string,
  partial: Partial<Omit<UserProfile, "updatedAt">>,
): Promise<UserProfile> {
  const existing = (await getProfile(userId)) ?? { interests: [], plan: "", updatedAt: 0 };
  const next: UserProfile = { ...existing, ...partial, updatedAt: Date.now() };

  if (redis) {
    await redis.set(KEY_PREFIX + userId, next);
  } else {
    memoryStore.set(userId, next);
  }
  return next;
}
