import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const uploadId = url.searchParams.get("uploadId");

  if (!uploadId) {
    return NextResponse.json({ error: "uploadId is required" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .select(
        `
        id,
        status,
        filename,
        reports (
          report
        )
      `
      )
      .eq("id", uploadId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (uploadError || !upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    // Lazy worker: If the upload is stuck in processing/pending, try to kick it.
    // This helps in local dev or if the background worker is not running.
    if (upload.status === "processing" || upload.status === "pending") {
      // We don't await this to avoid blocking the status check too long,
      // but in Vercel serverless this might be killed. 
      // However, since we are polling, if we await it, we might timeout.
      // Let's try awaiting it with a race against a timeout?
      // Or just await it and rely on the client's polling timeout being generous.
      // Given the user report, awaiting it is safer to ensure it runs at least a bit.
      
      const { processJobForUpload } = await import("@/lib/services/processAnalysisJob");
      await processJobForUpload(uploadId);
      
      // Re-fetch status after processing attempt
      const { data: updatedUpload } = await supabase
        .from("uploads")
        .select("status, reports ( report )")
        .eq("id", uploadId)
        .single();
        
      if (updatedUpload) {
         return NextResponse.json({
          status: updatedUpload.status,
          report: updatedUpload.reports?.[0]?.report ?? null,
        });
      }
    }

    return NextResponse.json({
      status: upload.status,
      report: upload.reports?.[0]?.report ?? null,
    });
  } catch (error) {
    console.error("Unable to fetch telemetry status", error);
    return NextResponse.json({ error: "Unable to fetch status" }, { status: 500 });
  }
}
