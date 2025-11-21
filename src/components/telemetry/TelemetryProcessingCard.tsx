"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProcessingProps = {
  uploadId: string;
  initialStatus: string;
};

export function TelemetryProcessingCard({ uploadId, initialStatus }: ProcessingProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(initialStatus === "reported" ? 100 : 15);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusCopy = useMemo(() => {
    if (status === "reported") {
      return "AI analysis complete";
    }
    if (status === "processing") {
      return "Analyzing telemetry with Gemini…";
    }
    if (status === "error") {
      return "We hit a snag while analyzing this file.";
    }
    return "Waiting to start analysis…";
  }, [status]);

  useEffect(() => {
    if (status === "reported") {
      router.push(`/telemetry/history/${uploadId}`);
      router.refresh();
      return;
    }

    const progressTimer = setInterval(() => {
      setProgress((value) => {
        if (status === "processing") {
          return Math.min(value + Math.random() * 10, 90);
        }
        return Math.min(value + 2, 60);
      });
    }, 1500);

    const pollTimer = setInterval(async () => {
      try {
        const response = await fetch(`/api/telemetry/status?uploadId=${uploadId}`);
        const payload = (await response.json()) as { status?: string; error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to check status");
        }

        if (payload.status === "reported") {
          setProgress(100);
          setStatus("reported");
        } else if (payload.status) {
          setStatus(payload.status);
        }
      } catch (error) {
        console.error("Status polling failed", error);
        setErrorMessage("Unable to reach the server. We’ll keep trying in the background.");
      }
    }, 5000);

    return () => {
      clearInterval(progressTimer);
      clearInterval(pollTimer);
    };
  }, [router, status, uploadId]);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          AI analysis
        </p>
        <h2 className="text-2xl font-semibold text-foreground">{statusCopy}</h2>
        <p className="text-sm text-muted-foreground">
          You can stay on this page. Once the AI finishes, it&apos;ll refresh automatically.
        </p>
      </div>

      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-muted">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{progress.toFixed(0)}% complete</p>
      </div>

      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}
