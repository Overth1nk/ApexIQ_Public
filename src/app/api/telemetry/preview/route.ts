import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseTelemetryPreview } from "@/lib/telemetry/preview";

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
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (uploadError || !upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    const { data: fileDownload, error: downloadError } = await supabase.storage
      .from("telemetry")
      .download(upload.storage_path);

    if (downloadError || !fileDownload) {
      return NextResponse.json({ error: "Unable to read file contents" }, { status: 500 });
    }

    const decoder = new TextDecoder("utf-8");
    const textSample = decoder.decode(await fileDownload.arrayBuffer());
    const preview = parseTelemetryPreview(textSample);

    return NextResponse.json({
      upload: {
        id: upload.id,
        filename: upload.filename,
        size_bytes: upload.size_bytes,
        sim: upload.sim,
        track: upload.track,
        car: upload.car,
        created_at: upload.created_at,
        status: upload.status,
      },
      preview,
    });
  } catch (error) {
    console.error("Telemetry preview failed", error);
    return NextResponse.json({ error: "Unexpected error while reading telemetry" }, { status: 500 });
  }
}
