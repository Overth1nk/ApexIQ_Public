import { NextResponse } from "next/server";
import { processNextAnalysisJob } from "@/lib/services/processAnalysisJob";

function isAuthorized(request: Request) {
  const configuredSecret = process.env.WORKER_SECRET;
  if (!configuredSecret) {
    return true;
  }

  const url = new URL(request.url);
  const secretParam = url.searchParams.get("secret");
  return secretParam === configuredSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized cron call" }, { status: 401 });
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
