import { NextResponse } from "next/server";
import { verifyAgentAuth } from "@/lib/agentAuth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAgentAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  console.log(`[Print-Agent] Job started printing: ${id}`);
  return NextResponse.json({ ok: true, status: "PRINTING", id });
}
