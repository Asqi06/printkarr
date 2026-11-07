import { NextResponse } from "next/server";
import { verifyAgentAuth } from "@/lib/agentAuth";

// In-memory queue fallback for server-side Next.js route
type AgentJob = {
  id: string;
  document: string;
  pages: number;
  copies: number;
  splitMixed: boolean;
  printType: "bw" | "color";
  sides: "single" | "double";
  paper: string;
  filePages: number;
  fileType: string;
  fileExt: string;
  status: string;
};

// Global queue tracking on server
let pendingJobs: AgentJob[] = [];

export function pushPrintJob(job: AgentJob) {
  pendingJobs.push(job);
}

export async function GET(request: Request) {
  if (!verifyAgentAuth(request)) {
    return NextResponse.json({ error: "Unauthorized agent token" }, { status: 401 });
  }

  // If there are pending jobs waiting for automatic hardware spooler
  const job = pendingJobs.find((j) => j.status === "RECEIVED" || j.status === "PRINT_QUEUE");
  if (!job) {
    return new Response(null, { status: 204 });
  }

  return NextResponse.json({ order: job });
}
