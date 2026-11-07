import { NextResponse } from "next/server";
import { verifyAgentAuth } from "@/lib/agentAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAgentAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ stopRequested: false });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAgentAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  console.log(`[Print-Agent] Job progress for ${id}:`, body);
  return NextResponse.json({ ok: true, stopRequested: false });
}
