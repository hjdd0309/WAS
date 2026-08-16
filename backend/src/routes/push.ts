import { Router } from "express";
import webpush from "web-push";
import { getProfile, saveProfile } from "../kv";
import { generateNotificationText } from "../notificationText";
import { getPersona } from "../personas";
import type { PushSubscriptionData } from "../types";

export const pushRouter = Router();

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:example@example.com";
const vapidConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (vapidConfigured) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey!, vapidPrivateKey!);
} else {
  console.warn("[push] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not set — /api/push/send will return 501.");
}

function isValidSubscription(body: unknown): body is PushSubscriptionData {
  const b = body as Record<string, unknown> | null;
  if (!b || typeof b.endpoint !== "string") return false;
  const keys = b.keys as Record<string, unknown> | undefined;
  return Boolean(keys && typeof keys.p256dh === "string" && typeof keys.auth === "string");
}

// 발표 데모용: 실제 push 발송/구독과 무관하게, 그 순간 프로필 기준으로
// 신선한 알림 문구를 하나 생성해서 바로 돌려준다. 캐싱된 pendingNotificationText를
// 쓰지 않고 매번 새로 생성하는 이유는 데모에서 벨을 여러 번 눌러도 같은
// 문구가 반복되지 않고 매번 다르게 나오길 원해서다(nano 모델이라 지연 부담 적음).
pushRouter.get("/push/preview-text", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(400).json({ error: "x-user-id header required" });
    return;
  }

  const profile = (await getProfile(userId)) ?? { interests: [], plan: "", updatedAt: Date.now() };
  const text = await generateNotificationText(profile, profile.personaId);
  res.status(200).json({ text: text || "전화하고 있어요 📞 탭하면 바로 받을 수 있어요" });
});

pushRouter.post("/push/subscribe", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(400).json({ error: "x-user-id header required" });
    return;
  }
  if (!isValidSubscription(req.body)) {
    res.status(400).json({ error: "invalid push subscription" });
    return;
  }

  await saveProfile(userId, { pushSubscription: req.body });
  res.status(200).json({ ok: true });
});

// 프론트(useAwayMonitor)가 away 임계값에 도달했을 때 호출. 미리 캐싱해둔
// pendingNotificationText를 즉시 보내 발송 경로에 LLM 지연이 끼지 않게 하고,
// 응답 후 다음 번을 위한 문구를 백그라운드로 새로 준비한다.
pushRouter.post("/push/send", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(400).json({ error: "x-user-id header required" });
    return;
  }
  if (!vapidConfigured) {
    res.status(501).json({ error: "push not configured" });
    return;
  }

  const profile = await getProfile(userId);
  if (!profile?.pushSubscription) {
    res.status(404).json({ error: "no push subscription for this user" });
    return;
  }

  const persona = getPersona(profile.personaId);
  const body = profile.pendingNotificationText || "전화하고 있어요 📞";

  try {
    await webpush.sendNotification(
      profile.pushSubscription,
      JSON.stringify({ title: persona.name, body, url: "/?call=1" }),
    );
  } catch (err) {
    console.error("web push send failed", err);
    res.status(502).json({ error: "push send failed" });
    return;
  }

  res.status(200).json({ ok: true });

  void generateNotificationText(profile, profile.personaId)
    .then((next) => {
      if (next) return saveProfile(userId, { pendingNotificationText: next });
    })
    .catch((err) => console.error("failed to regenerate pending notification text", err));
});
