"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { Tables } from "@/lib/types/database";

type UploadRow = Tables<"uploads">;
type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; preview: PreviewResponse }
  | { status: "error"; message: string };

type PreviewResponse = {
  upload: {
    id: string;
    filename: string;
    size_bytes: number;
    sim: string | null;
    track: string | null;
    car: string | null;
    created_at: string;
    status: string;
  };
  preview: {
    delimiter: string;
    headers: string[];
    rows: string[][];
    rawSample: string;
    truncated: boolean;
  };
};

function formatSize(bytes: number) {
  if (bytes > 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes > 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

function FormattedDate({ date }: { date: string }) {
  const formatted = useMemo(() => new Date(date).toLocaleString(), [date]);
  return <span>{formatted}</span>;
}

function statusBadge(status: string) {
  switch (status) {
    case "reported":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "processing":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    case "error":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
    default:
      return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

export function TelemetryHistoryList({ uploads }: { uploads: UploadRow[] }) {
  const [previewMap, setPreviewMap] = useState<Record<string, PreviewState>>({});

  async function handlePreview(uploadId: string) {
    setPreviewMap((prev) => ({
      ...prev,
      [uploadId]: { status: "loading" },
    }));

    try {
      const response = await fetch(`/api/telemetry/preview?uploadId=${uploadId}`);
      const json = (await response.json()) as PreviewResponse & { error?: string };

      if (!response.ok) {
        throw new Error(json.error || "Unable to read telemetry.");
      }

      setPreviewMap((prev) => ({
        ...prev,
        [uploadId]: { status: "success", preview: json },
      }));
    } catch (error) {
      console.error("Preview failed", error);
      setPreviewMap((prev) => ({
        ...prev,
        [uploadId]: {
          status: "error",
          message:
            error instanceof Error ? error.message : "Something went wrong while reading the file.",
        },
      }));
    }
  }

  if (!uploads.length) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card/70 p-8 text-center text-sm text-muted-foreground shadow-sm">
        <p>
          You haven&apos;t saved any telemetry yet. Upload a file and you&apos;ll see it listed here with a preview of the raw data the AI will eventually use.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {uploads.map((upload) => {
        const previewState = previewMap[upload.id] ?? { status: "idle" };

        return (
          <article
            key={upload.id}
            className="rounded-xl border border-border bg-card/90 p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  {upload.filename}
                </p>
                <p className="text-sm text-muted-foreground">
                  {upload.sim ?? "Unknown sim"} • {upload.track ?? "Unknown track"} •{" "}
                  {formatSize(upload.size_bytes)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Uploaded <FormattedDate date={upload.created_at} />
                </p>
                <span
                  className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(upload.status)}`}
                >
                  {upload.status}
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                  href={`/telemetry/history/${upload.id}`}
                >
                  View details
                </Link>
                <button
                  type="button"
                  onClick={() => handlePreview(upload.id)}
                  disabled={previewState.status === "loading"}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-wait disabled:opacity-60"
                >
                  {previewState.status === "loading" ? "Loading preview…" : "Preview telemetry"}
                </button>
              </div>
            </div>

            {previewState.status === "error" ? (
              <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{previewState.message}</p>
            ) : null}

            {previewState.status === "success" ? (
              <div className="mt-4 rounded-lg border border-border bg-muted/60 p-4 text-xs text-foreground">
                <p className="mb-2 font-semibold text-foreground">
                  Parsed sample ({previewState.preview.preview.headers.length} columns)
                </p>
                <div className="overflow-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr>
                        {previewState.preview.preview.headers.map((header) => (
                          <th key={header} className="px-2 py-1 font-semibold">
                            {header || "—"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewState.preview.preview.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-border/60">
                          {row.map((value, cellIndex) => (
                            <td key={`${rowIndex}-${cellIndex}`} className="px-2 py-1">
                              {value || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewState.preview.preview.truncated ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Showing a truncated preview. Download the file to inspect full telemetry data.
                  </p>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
