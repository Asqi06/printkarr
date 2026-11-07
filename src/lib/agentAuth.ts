import crypto from "node:crypto";

const AGENT_TOKEN =
  process.env.AGENT_TOKEN ||
  "26e3093ab30c5b8a7289eec92c73f697805903156070b517970eecb7c896d546";

export let lastAgentSeenAt: number = 0;

export function verifyAgentAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  const a = crypto.createHash("sha256").update(token).digest();
  const b = crypto.createHash("sha256").update(AGENT_TOKEN).digest();
  if (crypto.timingSafeEqual(a, b)) {
    lastAgentSeenAt = Date.now();
    return true;
  }
  return false;
}
