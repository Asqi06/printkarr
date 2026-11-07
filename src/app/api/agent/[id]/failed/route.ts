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
  const body = await request.json().catch(() => ({}));
  console.error(`[Print-Agent] Job failed: ${id}`, body);

  return NextResponse.json({
    ok: true,
    order: { id, status: "PRINT_FAILED" },
  });
}
