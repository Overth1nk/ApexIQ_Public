import { PageIntro } from "@/components/layout/PageIntro";
import { TelemetryUploadForm } from "@/components/telemetry/TelemetryUploadForm";

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center bg-background px-6 py-16 font-sans sm:px-10">
      <div className="flex w-full max-w-6xl flex-col gap-12">
        <PageIntro
          kicker="Apex IQ"
          title="Data-driven Coaching for the Modern Racer"
          description="Upload your telemetry, analyze your performance, and unlock your true potential on the track."
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-racing-red rounded-full"></span>
                Upload Telemetry
              </h2>
              <TelemetryUploadForm />
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-foreground">
                How it works
              </h2>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                  <span>Upload your telemetry file from your sim racing session.</span>
                </li>
                <li className="flex gap-3 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                  <span>Our AI analyzes your braking points, throttle inputs, and racing lines.</span>
                </li>
                <li className="flex gap-3 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                  <span>Receive actionable coaching tips to improve your lap times.</span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2 text-foreground">
                Supported Sims
              </h2>
              <p className="text-sm text-muted-foreground">
                Currently supporting any CSV telemetry files (.csv). Easiest accessibility is to upload the files from your favorite sim into MoTeC&apos;s software and export as a CSV. More platforms coming soon.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
