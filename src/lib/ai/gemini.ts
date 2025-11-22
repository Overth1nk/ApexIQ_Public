import { parseTelemetryPreview, type TelemetryPreview } from "@/lib/telemetry/preview";
import { GoogleGenAI } from "@google/genai";

export type GeminiAnalysisInput = {
  upload: {
    id: string;
    filename: string;
    sim: string | null;
    track: string | null;
    car: string | null;
    session_date: string | null;
  };
  fileContents: string;
};

export type ReportSections = {
  pace: string;
  braking: string;
  throttle: string;
  corners: string;
  sessionPlan: string;
};

export type TrackSegmentInsight = {
  name: string;
  issue: string;
  improvement: string;
  metric?: string;
};

export type GeminiAnalysisResult = {
  summary: string;
  recommendations: Array<{ title: string; detail: string }>;
  preview: TelemetryPreview;
  sections?: Partial<ReportSections>;
  segments?: TrackSegmentInsight[];
  mode: "real" | "fallback" | "sample";
};

const PLACEHOLDER_RECOMMENDATIONS = [
  {
    title: "Brake release into T1",
    detail: "Trail off the brake 3m earlier and feed throttle smoothly to keep the chassis balanced and gain 0.1s on entry.",
  },
  {
    title: "Mid-corner steering rate",
    detail: "Steering trace shows a mid-apex pause—maintain a constant arc so the lateral load doesn’t spike mid-corner.",
  },
  {
    title: "Exit traction",
    detail: "Throttle modulation is aggressive after apex. Add 0.4s of ramp to avoid TC and pick up speed down the straight.",
  },
] as const;

const PLACEHOLDER_SAMPLE = `lap,speed,throttle,brake,lateral_g
1,210,0.82,0.12,1.42
1,198,0.5,0,1.05
1,236,1,0,0.88`;

const DEFAULT_EXCERPT_LIMIT = Number(process.env.TELEMETRY_EXCERPT_LIMIT ?? 150_000);
const MAX_DATA_LINES = Number(process.env.TELEMETRY_MAX_LINES ?? 1200);

function buildPlaceholderReport(
  upload: GeminiAnalysisInput["upload"],
  preview: TelemetryPreview,
  mode: "fallback" | "sample" = "fallback"
): GeminiAnalysisResult {
  const filename = upload.filename ?? "this session";
  return {
    summary: `Once Gemini runs on ${filename}, it will describe the big rocks—pace, balance, and exits—just like this sample.`,
    recommendations: [...PLACEHOLDER_RECOMMENDATIONS],
    preview,
    sections: {
      pace: "Placeholder pace summary referencing consistent lap flow.",
      braking: "Placeholder braking summary focusing on markers and release.",
      throttle: "Placeholder throttle summary emphasizing ramp and traction.",
      corners: "Placeholder corners summary about line choice and steering rate.",
      sessionPlan: "Placeholder session plan describing what to practice next.",
    },
    segments: [
      {
        name: "Turn 1 braking zone",
        issue: "Brake pressure spikes to 80% late in the zone, forcing early turn-in.",
        improvement: "Trail the brake smoothly from 70% to 20% by apex to keep rotation predictable.",
        metric: "Entry 136 mph → apex 104 mph",
      },
      {
        name: "Sector 2 switchback",
        issue: "Throttle hovers around 40-60%, causing hesitation and loss of momentum.",
        improvement: "Commit to a single steering input and roll into throttle once steering unwinds.",
      },
    ],
    mode,
  };
}

export function generatePlaceholderTelemetryInsights(
  upload: GeminiAnalysisInput["upload"],
  previewOverride?: TelemetryPreview
): GeminiAnalysisResult {
  const preview = previewOverride ?? parseTelemetryPreview(PLACEHOLDER_SAMPLE);
  return buildPlaceholderReport(upload, preview, "sample");
}

export async function generateTelemetryInsights({
  upload,
  fileContents,
}: GeminiAnalysisInput): Promise<GeminiAnalysisResult> {
  const preview = parseTelemetryPreview(fileContents);
  const fallback = buildPlaceholderReport(upload, preview);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY missing; returning placeholder report.");
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const telemetryExcerpt = buildTelemetryExcerpt(fileContents);

    const prompt = [
      "You are a professional racing engineer creating actionable telemetry insights for a single lap.",
      "Return ONLY valid JSON matching exactly this schema:",
      "{",
      '  "summary": string,',
      '  "recommendations": [ { "title": string, "detail": string }, ... ],',
      '  "sections": {',
      '    "pace": string,',
      '    "braking": string,',
      '    "throttle": string,',
      '    "corners": string,',
      '    "sessionPlan": string',
      "  },",
      '  "segments": [',
      '    { "name": string, "issue": string, "improvement": string, "metric"?: string },',
      "    ...",
      "  ]",
      "}",
      "Do not include any extra text before or after the JSON.",
      "Metadata:",
      JSON.stringify(upload),
      "Preview (first few rows parsed on the client):",
      preview.rawSample || "No preview rows provided.",
      "Normalized telemetry rows (start after headers):",
      telemetryExcerpt || "Raw CSV was empty.",
      "Guidance:",
      "- If specific track or car details are missing in metadata, provide general high-performance driving advice based on the telemetry patterns (g-forces, inputs).",
      "- Always mention specific evidence: distances from corner (meters/ft), speeds (mph with kph in parentheses), gears, RPM, brake %, throttle %, lateral/longitudinal G values. Avoid trivial time ranges like “0.000s-0.250s”; tie to corners, straights, or distance markers instead.",
      '- Each sections.pace/braking/throttle/corners/sessionPlan value must be multiline and start with "What’s working:" on its own line followed by 1-2 bullet points, then "Needs improvement:" on its own line with 2-3 bullet points. Bullets must be on separate lines starting with "- " (no inline lists) and reference concrete telemetry (e.g., "brake peaks at 78% at 142 mph (228 kph) ~120m before apex; release is too early"). Avoid repeating phrasing across sections.',
      "- Provide at least six segment entries referencing specific corners or sequences (e.g., “Abbey (T1) braking zone”, “Maggotts/Becketts/Chapel sequence”, “Hangar Straight into Stowe”). Use accurate track/section names when the track is identifiable (e.g., Silverstone corner names) or use Turn numbers.",
      "- For every segment, include a non-empty metric summarizing the key signal (speed, RPM, brake %, throttle %, gear, G, distance marker).",
      '- For every segment.improvement, include 3-5 bullet points separated by newline starting with "- " that describe specific corrective actions (line change with apex/exit description, brake release profile, throttle ramp timing, gear choice) and reference the evidence numbers you saw.',
      '- Never use vague directives like "change apex"; specify how (e.g., "delay apex by ~2-3m and hold 3-4 mph (5-6 kph) higher mid-corner speed").',
      "- Separate praise vs fixes: ensure strengths are called out in sections and recommendations distinct from the improvement bullets in segments.",
      "- Use traditional racing units: RPM; power/torque in imperial first with metric in parentheses if mentioned (e.g., 700 lb-ft (949 Nm)); speeds mph with kph in parentheses; temps in °C; distances in meters/feet where available.",
      "- Tailor recommendations to the data trends you see instead of generic advice and avoid redundancy across sections and segments.",
    ].join("\n");

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error("Gemini response was empty.");
    }

    const parsed = JSON.parse(extractJsonPayload(responseText)) as {
      summary?: unknown;
      recommendations?: Array<{ title?: unknown; detail?: unknown }>;
      sections?: Partial<Record<keyof ReportSections, unknown>>;
      segments?: Array<Partial<TrackSegmentInsight>>;
    };
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations
          .map((rec) => ({
            title: typeof rec?.title === "string" ? rec.title.trim() : "",
            detail: typeof rec?.detail === "string" ? rec.detail.trim() : "",
          }))
          .filter((rec: { title: string; detail: string }) => rec.title && rec.detail)
      : [];

    // Relaxed validation: Return whatever we have, even if incomplete.
    // Only fail if we have absolutely nothing useful.
    if (!summary && recommendations.length === 0 && !parsed.sections && !parsed.segments) {
       console.warn("Gemini response empty or invalid—using placeholder.");
       return buildPlaceholderReport(upload, preview, "fallback");
    }

    return {
      summary,
      recommendations,
      preview,
      sections: normalizeSections(parsed.sections),
      segments: normalizeSegments(parsed.segments),
      mode: "real",
    };
  } catch (error) {
    logGeminiError(error);
    // Return a specific "failed" mode so the UI can show an error message
    // instead of a placeholder report that looks like success.
    return {
        ...fallback,
        mode: "fallback" // We'll interpret "fallback" as "failed" in the UI for now, or we can add a "failed" mode.
    };
  }
}

function extractJsonPayload(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Unable to locate JSON payload in Gemini response.");
  }
  return text.slice(start, end + 1);
}

type ErrorWithResponse = Error & {
  status?: number;
  cause?: unknown;
  response?: { text?: () => Promise<string> };
};

async function logGeminiError(error: unknown) {
  if (!(error instanceof Error)) {
    console.error("Gemini analysis failed; falling back to placeholder", error);
    return;
  }

  const enriched: Record<string, unknown> = {
    name: error.name,
    message: error.message,
  };

  const typedError = error as ErrorWithResponse;
  if (typeof typedError.status === "number") {
    enriched.status = typedError.status;
  }
  if (typeof typedError.cause !== "undefined") {
    enriched.cause = typedError.cause;
  }

  if (typedError.response?.text) {
    try {
      enriched.rawResponse = await typedError.response.text();
    } catch (responseError) {
      enriched.responseReadError = responseError;
    }
  }

  console.error("Gemini analysis failed; falling back to placeholder", enriched);
}

function normalizeSections(
  sections: Partial<Record<keyof ReportSections, unknown>> | undefined
): Partial<ReportSections> | undefined {
  if (!sections) {
    return undefined;
  }

  const normalized: Partial<ReportSections> = {};
  (["pace", "braking", "throttle", "corners", "sessionPlan"] as const).forEach((key) => {
    const value = sections[key];
    if (typeof value === "string" && value.trim().length > 0) {
      normalized[key] = value.trim();
    }
  });

  return normalized;
}

function normalizeSegments(segments: Array<Partial<TrackSegmentInsight>> | undefined) {
  if (!segments) {
    return undefined;
  }

  const cleaned = segments
    .map((segment) => {
      const name = typeof segment.name === "string" ? segment.name.trim() : "";
      const issue = typeof segment.issue === "string" ? segment.issue.trim() : "";
      const improvement = typeof segment.improvement === "string" ? segment.improvement.trim() : "";
      const metric = typeof segment.metric === "string" ? segment.metric.trim() : undefined;

      if (!name || !issue || !improvement) {
        return null;
      }

      return { name, issue, improvement, metric };
    })
    .filter(Boolean) as TrackSegmentInsight[];

  return cleaned.length ? cleaned : undefined;
}

function buildTelemetryExcerpt(fileContents: string) {
  const normalized = fileContents
    .split(/\r?\n/)
    .map((line) => line.replace(/\0/g, "").trim())
    .filter((line) => line.length > 0);

  const headerIndex = normalized.findIndex((line) => {
    const lower = line.toLowerCase();
    return lower.includes("time") && (lower.includes("speed") || lower.includes("distance"));
  });

  const dataLines =
    headerIndex === -1 ? normalized.slice(0, MAX_DATA_LINES) : normalized.slice(headerIndex, headerIndex + MAX_DATA_LINES);

  const excerpt = dataLines.join("\n");
  return excerpt.slice(0, DEFAULT_EXCERPT_LIMIT);
}
