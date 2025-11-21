import { NextResponse } from "next/server";
import { processNextAnalysisJob } from "@/lib/services/processAnalysisJob";

export const dynamic = "force-dynamic";

function verifyWorkerSecret(request: Request) {
  const configuredSecret = process.env.WORKER_SECRET;
  if (!configuredSecret) {
    return true;
  }

  const headerSecret = request.headers.get("x-worker-secret");
  return headerSecret === configuredSecret;
}

export async function POST(request: Request) {
  if (!verifyWorkerSecret(request)) {
    return NextResponse.json({ error: "Unauthorized worker" }, { status: 401 });
  }

  const result = await processNextAnalysisJob();

  if (result.status === "idle") {
    return NextResponse.json({ message: "No pending jobs" });
  }

  if (result.status === "error") {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Processed job", uploadId: result.uploadId });
}
