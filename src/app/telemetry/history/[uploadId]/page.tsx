import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TelemetryProcessingCard } from "@/components/telemetry/TelemetryProcessingCard";
import { generatePlaceholderTelemetryInsights } from "@/lib/ai/gemini";

type PageProps = {
  params: Promise<{
    uploadId: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function TelemetryDetailPage({ params }: PageProps) {
  const { uploadId } = await params;
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .select("id, filename, status, sim, track, car, created_at, session_date")
    .eq("id", uploadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (uploadError) {
    console.error("Unable to load telemetry detail", uploadError);
    notFound();
  }

  if (!upload) {
    notFound();
  }

  const { data: reportRow, error: reportError } = await supabase
    .from("reports")
    .select("report")
    .eq("upload_id", upload.id)
    .maybeSingle();

  if (reportError) {
    console.error("Unable to fetch AI report", reportError);
  }

  const rawReport = reportRow?.report;
  const parsedReport =
    typeof rawReport === "string"
      ? (JSON.parse(rawReport) as {
        summary?: string;
        recommendations?: Array<{ title: string; detail: string }>;
        preview?: { headers: string[]; rows: string[][] };
        sections?: Record<string, string>;
        segments?: Array<{ name?: string; issue?: string; improvement?: string; metric?: string }>;
        status?: string;
      })
      : (rawReport as
        | {
          summary?: string;
          recommendations?: Array<{ title: string; detail: string }>;
          preview?: { headers: string[]; rows: string[][] };
          sections?: Record<string, string>;
          segments?: Array<{ name?: string; issue?: string; improvement?: string; metric?: string }>;
          status?: string;
        }
        | undefined);

  // console.log("parsedReport", parsedReport);

  const summary = typeof parsedReport?.summary === "string" ? parsedReport.summary : null;
  const recommendations = Array.isArray(parsedReport?.recommendations) ? parsedReport.recommendations : [];
  const sections = parsedReport?.sections ?? {};
  const segments = Array.isArray(parsedReport?.segments)
    ? parsedReport.segments
      .map((segment) => ({
        name: typeof segment?.name === "string" ? segment.name : "",
        issue: typeof segment?.issue === "string" ? segment.issue : "",
        improvement: typeof segment?.improvement === "string" ? segment.improvement : "",
        metric: typeof segment?.metric === "string" ? segment.metric : undefined,
      }))
      .filter((segment) => segment.name && segment.issue && segment.improvement)
    : [];

  const placeholderReport = generatePlaceholderTelemetryInsights({
    id: upload.id,
    filename: upload.filename,
    sim: upload.sim,
    track: upload.track,
    car: upload.car,
    session_date: upload.session_date,
  });

  const storedStatus = typeof parsedReport?.status === "string" ? parsedReport.status : "ok";

  const resolvedReport =
    upload.status === "reported"
      ? {
        summary: summary && summary.trim().length > 0 ? summary : placeholderReport.summary,
        recommendations:
          recommendations && recommendations.length > 0 ? recommendations : placeholderReport.recommendations,
        sections:
          sections && Object.keys(sections).length > 0
            ? sections
            : placeholderReport.sections ?? {
              pace: placeholderReport.summary,
              braking: placeholderReport.summary,
              throttle: placeholderReport.summary,
              corners: placeholderReport.summary,
              sessionPlan: placeholderReport.summary,
            },
        segments: segments.length > 0 ? segments : placeholderReport.segments ?? [],
        status: storedStatus,
      }
      : { ...placeholderReport, status: "processing" };

  return (
    <div className="min-h-screen bg-background px-6 py-12 font-sans text-foreground sm:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Telemetry session</p>
          <h1 className="text-3xl font-semibold">{upload.filename}</h1>
          <p className="text-sm text-muted-foreground">
            {upload.sim ?? "Unknown sim"} • {upload.track ?? "Unknown track"} • {upload.car ?? "Unknown car"}
          </p>
        </div>

        {upload.status !== "reported" ? (
          <>
            <TelemetryProcessingCard uploadId={upload.id} initialStatus={upload.status} />
            <AIReport
              summary={resolvedReport.summary}
              recommendations={resolvedReport.recommendations}
              sections={resolvedReport.sections}
              segments={resolvedReport.segments}
              status={resolvedReport.status ?? "processing"}
            />
          </>
        ) : (
          <AIReport
            summary={resolvedReport.summary}
            recommendations={resolvedReport.recommendations}
            sections={resolvedReport.sections}
            segments={resolvedReport.segments}
            status={resolvedReport.status ?? "ok"}
          />
        )}
      </div>
    </div>
  );
}

type AIReportProps = {
  summary: string | null;
  recommendations: Array<{ title: string; detail: string }>;
  sections?: Record<string, string>;
  segments?: Array<{ name: string; issue: string; improvement: string; metric?: string }>;
  status?: string;
};

function AIReport({ summary, recommendations, sections, segments, status }: AIReportProps) {
  if (status === "failed") {
    return (
      <section className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
        <p className="text-base font-semibold">Analysis Failed</p>
        <p>
          We’re sorry, but the AI encountered an error while analyzing your telemetry. This can happen if the file format is unexpected or if the AI service is temporarily unavailable.
        </p>
        <p>
          Please try re-uploading the file or analyzing a different session.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          AI report ready
        </p>
        <h2 className="text-2xl font-semibold text-foreground">Coaching summary</h2>
        <p className="text-sm text-muted-foreground">
          These insights are generated from the telemetry file you just uploaded.
        </p>
      </div>

      {summary ? <p className="text-base text-foreground">{summary}</p> : null}

      {sections ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(sections).map(([key, value]) => (
            <div
              key={key}
              className="rounded-xl border border-border bg-muted/60 p-4 text-sm text-foreground"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {key}
              </p>
              <p className="mt-2">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {segments && segments.length ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Corner-by-corner breakdown
          </p>
          {segments.map((segment, index) => (
            <div
              key={`${segment.name}-${index}`}
              className="rounded-xl border border-border bg-card/80 p-4"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold text-foreground">{segment.name}</p>
                {segment.metric ? (
                  <span className="text-xs text-muted-foreground">{segment.metric}</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Issue:</span> {segment.issue}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Improvement:</span>{" "}
                {segment.improvement}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {recommendations.length ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Key actions
          </p>
          {recommendations.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-muted/60 p-4"
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
