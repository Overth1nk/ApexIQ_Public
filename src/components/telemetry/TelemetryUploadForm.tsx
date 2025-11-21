"use client";

import { FormEvent, useMemo, useState } from "react";
// import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Constants, TablesInsert } from "@/lib/types/database";
import { TelemetryProcessingCard } from "./TelemetryProcessingCard";

type UploadInsert = TablesInsert<"uploads">;
type Status =
  | { type: "idle"; message: string | null }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const simOptions = Constants.public.Enums.sim_title;

function normalizeFileName(filename: string) {
  return filename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function createObjectKey(filename: string, userId: string) {
  const safeFileName = normalizeFileName(filename) || "telemetry.csv";
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `telemetry/${userId}/${unique}-${safeFileName}`;
}

export function TelemetryUploadForm() {
  // const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>({
    type: "idle",
    message: null,
  });
  const [isUploading, setIsUploading] = useState(false);

  const fileLabel = useMemo(() => {
    if (!selectedFile) {
      return "Drag and drop, or browse your files";
    }
    const sizeKb = (selectedFile.size / 1024).toFixed(1);
    return `${selectedFile.name} • ${sizeKb} KB`;
  }, [selectedFile]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "idle", message: null });

    if (!selectedFile) {
      setStatus({ type: "error", message: "Please choose a telemetry file first." });
      return;
    }

    setIsUploading(true);

    const form = event.currentTarget;

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setStatus({
          type: "error",
          message: "You must be signed in to upload telemetry.",
        });
        return;
      }

      const formData = new FormData(form);
      const sim = (formData.get("sim") as UploadInsert["sim"]) ?? "Other";
      const track = String(formData.get("track") || "").trim() || null;
      const car = String(formData.get("car") || "").trim() || null;
      const sessionDateRaw = String(formData.get("sessionDate") || "").trim();
      const session_date = sessionDateRaw ? sessionDateRaw : null;

      const objectPath = createObjectKey(selectedFile.name, user.id);

      const { error: uploadError } = await supabase.storage
        .from("telemetry")
        .upload(objectPath, selectedFile, {
          cacheControl: "3600",
          contentType: selectedFile.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("Telemetry upload failed", uploadError);
        setStatus({
          type: "error",
          message: uploadError.message,
        });
        return;
      }

      const insertPayload: UploadInsert = {
        filename: selectedFile.name,
        size_bytes: selectedFile.size,
        storage_path: objectPath,
        user_id: user.id,
        sim,
        track,
        car,
        session_date,
      };

      const { data: insertedUpload, error: dbError } = await supabase
        .from("uploads")
        .insert(insertPayload)
        .select("id")
        .single();

      if (dbError) {
        console.error("Saving upload metadata failed", dbError);
        // cleanup the orphaned file
        await supabase.storage.from("telemetry").remove([objectPath]);
        setStatus({
          type: "error",
          message: "We saved the file but couldn't capture metadata. Try again.",
        });
        return;
      }

      if (insertedUpload?.id) {
        // Trigger analysis in the background
        fetch("/api/telemetry/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId: insertedUpload.id }),
        }).catch((error) => {
          console.error("Inline analysis failed", error);
          // Fallback to job queue
          fetch("/api/telemetry/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uploadId: insertedUpload.id }),
          }).catch((error) => {
            console.error("Unable to enqueue analysis job", error);
          });
        });

        // Show processing card instead of navigating immediately
        setSelectedFile(null);
        form.reset();
        setStatus({
          type: "success",
          message: insertedUpload.id,
        });
      }
    } catch (error) {
      console.error("Unexpected telemetry upload failure", error);
      setStatus({
        type: "error",
        message: "We couldn't save your telemetry right now. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  // If upload succeeded and we have an uploadId, show processing card
  if (status.type === "success" && status.message) {
    return <TelemetryProcessingCard uploadId={status.message} initialStatus="pending" />;
  }

  return (
    <section className="rounded-xl border border-border bg-card/50 p-6 shadow-sm backdrop-blur">
      <h2 className="text-lg font-semibold text-foreground">
        Upload a telemetry file
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Store your lap export so the future AI analyzer can crunch it. For now, we keep it safe and let you inspect the raw data.
      </p>

      <form className="mt-6 space-y-5" onSubmit={handleUpload}>
        <label
          htmlFor="telemetry-file"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/50 p-6 text-center transition hover:border-primary/50 hover:bg-muted"
        >
          <span className="text-sm font-medium text-foreground">
            {fileLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            Supported files: Any .csv
          </span>
          <input
            id="telemetry-file"
            name="telemetry"
            type="file"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
            }}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-foreground">
            Simulator
            <div className="relative mt-1">
              <select
                name="sim"
                className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-12 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                defaultValue="Other"
              >
                {simOptions.map((sim) => (
                  <option key={sim} value={sim}>
                    {sim}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="block"
                >
                  <path
                    d="M4 6.5 8 10l4-3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </label>

          <label className="text-sm font-medium text-foreground">
            Session date
            <div className="relative mt-1">
              <input
                type="date"
                name="sessionDate"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-12 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="block"
                >
                  <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M9 3v4M15 3v4M4 9h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
            </div>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-foreground">
            Track
            <input
              type="text"
              name="track"
              placeholder="Spa, Suzuka, Road Atlanta…"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="text-sm font-medium text-foreground">
            Car
            <input
              type="text"
              name="car"
              placeholder="992 Cup, GT3, F4…"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>

        {status.type === "error" && status.message ? (
          <p className="text-sm text-destructive">
            {status.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isUploading || !selectedFile}
          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Saving telemetry…" : "Save telemetry"}
        </button>
      </form>
    </section>
  );
}
