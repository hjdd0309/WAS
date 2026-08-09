import type { NextFunction, Request, Response } from "express";

/**
 * A frontend-embedded secret is visible to anyone who opens devtools, so this
 * is not real authentication — it only raises the bar against bots that find
 * the bare Vercel URL and start hitting it. Real auth would need per-user
 * accounts, which is out of scope for this demo.
 */
export function requireAppSecret(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.APP_SHARED_SECRET;
  if (!expected) {
    // Not configured — allow through (local dev) but this must be set in prod.
    next();
    return;
  }

  const provided = req.header("x-app-secret");
  if (provided !== expected) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  next();
}
