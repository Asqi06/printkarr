import { NextResponse } from "next/server";
import { verifyAgentAuth, lastAgentSeenAt } from "@/lib/agentAuth";

export async function GET(request: Request) {
  if (!verifyAgentAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secondsSinceSeen = lastAgentSeenAt
    ? Math.round((Date.now() - lastAgentSeenAt) / 1000)
    : null;

  return NextResponse.json({
    ok: true,
    agentSeenAt: lastAgentSeenAt || null,
    secondsSinceSeen,
    queueDepth: 0,
    printerConfigured: process.env.PRINTER_NAME || "L3250 Series(Network)",
  });
}
