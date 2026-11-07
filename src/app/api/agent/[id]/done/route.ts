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
  console.log(`[Print-Agent] Job finished: ${id}`, body);

  return NextResponse.json({
    ok: true,
    verificationRequired: false,
    order: { id, status: "PACKED" },
  });
}
