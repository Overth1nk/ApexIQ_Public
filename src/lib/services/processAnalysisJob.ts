import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateTelemetryInsights } from "@/lib/ai/gemini";
import type { Tables } from "@/lib/types/database";

type AnalysisJobRow = Tables<"analysis_jobs">;

export type JobResult =
  | { status: "idle" }
  | { status: "processed"; uploadId: string }
  | { status: "processing"; uploadId: string }
  | { status: "error"; message: string };

async function executeJob(admin: ReturnType<typeof getSupabaseAdminClient>, job: AnalysisJobRow): Promise<JobResult> {
  try {
    await admin
      .from("analysis_jobs")
      .update({
        status: "processing",
        attempts: job.attempts + 1,
        error_message: null,
      })
      .eq("id", job.id);

    const { data: upload, error: uploadError } = await admin
      .from("uploads")
      .select("id, filename, storage_path, sim, track, car, session_date, status")
      .eq("id", job.upload_id)
      .maybeSingle();

    if (uploadError || !upload) {
      throw new Error("Upload not found for job");
    }

    const { data: fileDownload, error: downloadError } = await admin.storage
      .from("telemetry")
      .download(upload.storage_path);

    if (downloadError || !fileDownload) {
      throw new Error(downloadError?.message ?? "Unable to download telemetry file");
    }

    const decoder = new TextDecoder("utf-8");
    const fileText = decoder.decode(await fileDownload.arrayBuffer());

    const aiResult = await generateTelemetryInsights({
      upload: {
        id: upload.id,
        filename: upload.filename,
        sim: upload.sim,
        track: upload.track,
        car: upload.car,
        session_date: upload.session_date,
      },
      fileContents: fileText,
    });
    const sectionResult = ensureSections(
      aiResult.sections,
      aiResult.summary,
      aiResult.recommendations,
      aiResult.mode === "fallback"
    );
    const segmentResult = ensureSegments(aiResult.segments, aiResult.mode === "fallback");
    
    // Determine status:
    // "fallback" -> Analysis completely failed (API error, etc)
    // "partial" -> Analysis ran but some sections are missing
    // "ok" -> Everything looks good
    const reportStatus =
      aiResult.mode === "fallback"
        ? "failed" // Changed from "fallback" to "failed" to be explicit
        : sectionResult.missing.length || segmentResult.missing
          ? "partial"
          : "ok";

    const { error: reportError } = await admin.from("reports").upsert(
      {
        upload_id: upload.id,
        model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
        report: {
          summary: aiResult.summary || "Summary unavailable.",
          recommendations: aiResult.recommendations,
          preview: aiResult.preview,
          sections: sectionResult.values,
          // Spread sections to top level to satisfy database constraint "reports_report_min_keys_ck"
          ...sectionResult.values,
          segments: segmentResult.segments,
          status: reportStatus,
          missingSections: sectionResult.missing,
        },
      },
      { onConflict: "upload_id" }
    );

    if (reportError) {
      console.error("Report upsert failed", reportError);
      throw reportError;
    }

    await admin
      .from("uploads")
      .update({ status: "reported" })
      .eq("id", upload.id);

    await admin
      .from("analysis_jobs")
      .update({ status: "succeeded", error_message: null })
      .eq("id", job.id);

    return { status: "processed", uploadId: upload.id };
  } catch (error) {
    console.error("Analysis worker failed", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown worker error";

    await admin
      .from("analysis_jobs")
      .update({ status: "failed", error_message: errorMessage })
      .eq("id", job.id);

    await admin
      .from("uploads")
      .update({ status: "error" })
      .eq("id", job.upload_id);

    return { status: "error", message: errorMessage };
  }
}

export async function processJobForUpload(uploadId: string): Promise<JobResult> {
  const admin = getSupabaseAdminClient();

  const { data: existingJob, error } = await admin
    .from("analysis_jobs")
    .select("*")
    .eq("upload_id", uploadId)
    .maybeSingle();

  if (error) {
    console.error("Unable to fetch analysis job", error);
    return { status: "error", message: "Unable to fetch analysis job" };
  }

  if (!existingJob) {
    const { data: newJob, error: insertError } = await admin
      .from("analysis_jobs")
      .insert({
        upload_id: uploadId,
        status: "pending",
        attempts: 0,
        error_message: null,
      })
      .select("*")
      .single();

    if (insertError || !newJob) {
      console.error("Unable to create analysis job", insertError);
      return { status: "error", message: "Unable to create analysis job" };
    }

    return executeJob(admin, newJob);
  }

  if (existingJob.status === "processing") {
    const updatedAt = new Date(existingJob.updated_at).getTime();
    const now = Date.now();
    // If job hasn't updated in 1 minute, assume it crashed and retry
    if (now - updatedAt < 60 * 1000) {
      return { status: "processing", uploadId };
    }
    console.warn(`Restarting stale job ${existingJob.id} (last updated ${existingJob.updated_at})`);
  }

  if (existingJob.status === "succeeded") {
    return { status: "processed", uploadId };
  }

  return executeJob(admin, existingJob);
}

export async function processNextAnalysisJob(): Promise<JobResult> {
  const admin = getSupabaseAdminClient();

  const { data: job, error: jobError } = await admin
    .from("analysis_jobs")
    .select("*")
    .in("status", ["pending", "failed"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (jobError) {
    console.error("Failed to query analysis jobs", jobError);
    return { status: "error", message: "Unable to read job status" };
  }

  if (!job) {
    return { status: "idle" };
  }

  return executeJob(admin, job);
}

function ensureSections(
  sections: Partial<import("@/lib/ai/gemini").ReportSections> | undefined,
  summary: string,
  recommendations: Array<{ title: string; detail: string }>,
  isFallback: boolean
) {
  // If we are in fallback mode (failed), we want to show specific error messages.
  // If we are in partial mode (success but missing data), we show "Analysis unavailable".
  
  const errorMessage = isFallback
    ? "Analysis failed for this section."
    : "Analysis unavailable for this section.";

  const defaultSections: import("@/lib/ai/gemini").ReportSections = {
    pace: errorMessage,
    braking: errorMessage,
    throttle: errorMessage,
    corners: errorMessage,
    sessionPlan: errorMessage,
  };

  const missing: string[] = [];

  (["pace", "braking", "throttle", "corners", "sessionPlan"] as const).forEach((key) => {
    const value = sections?.[key];
    if (typeof value === "string" && value.trim().length > 0) {
      defaultSections[key] = value.trim();
    } else {
      missing.push(key);
    }
  });

  return { values: defaultSections, missing };
}

function ensureSegments(
  segments: import("@/lib/ai/gemini").TrackSegmentInsight[] | undefined,
  isFallback: boolean
) {
  if (segments && segments.length) {
    return { segments, missing: false };
  }

  return {
    segments: [
      {
        name: isFallback ? "Analysis Failed" : "No Insights",
        issue: isFallback
          ? "We could not generate corner insights due to an error."
          : "No specific corner insights were generated for this session.",
        improvement: "Try uploading a clearer telemetry file.",
      },
    ],
    missing: true,
  };
}
