import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { processJobForUpload } from "@/lib/services/processAnalysisJob";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { uploadId } = await request.json().catch(() => ({}));

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
      .select("id, user_id")
      .eq("id", uploadId)
      .maybeSingle();

    if (uploadError || !upload || upload.user_id !== user.id) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    const result = await processJobForUpload(uploadId);

    if (result.status === "error") {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    if (result.status === "idle") {
      return NextResponse.json({ status: "idle" });
    }

    return NextResponse.json({ status: result.status, uploadId: result.uploadId });
  } catch (error) {
    console.error("Inline analysis failed", error);
    return NextResponse.json({ error: "Unable to analyze telemetry" }, { status: 500 });
  }
}
