import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { uploadId } = await request.json().catch(() => ({}));

  if (!uploadId) {
    return NextResponse.json({ error: "uploadId is required" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const admin = getSupabaseAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .select("id, user_id, status")
      .eq("id", uploadId)
      .maybeSingle();

    if (uploadError || !upload || upload.user_id !== user.id) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    await admin.from("analysis_jobs").upsert(
      {
        upload_id: upload.id,
        status: "pending",
        attempts: 0,
        error_message: null,
      },
      { onConflict: "upload_id" }
    );

    await admin
      .from("uploads")
      .update({ status: "processing" })
      .eq("id", upload.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to enqueue analysis job", error);
    return NextResponse.json({ error: "Failed to enqueue job" }, { status: 500 });
  }
}
