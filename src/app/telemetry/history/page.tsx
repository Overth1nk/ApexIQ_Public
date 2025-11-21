import { TelemetryHistoryList } from "@/components/telemetry/TelemetryHistoryList";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function TelemetryHistoryPage() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: uploads, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Unable to list uploads", error);
      throw error;
    }

    return (
      <div className="min-h-screen bg-background px-6 py-16 font-sans text-foreground sm:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold">Telemetry history</h1>
            <p className="text-sm text-muted-foreground">
              Review what you&apos;ve uploaded and inspect the raw data that will feed the AI coach.
            </p>
          </header>

          <TelemetryHistoryList uploads={uploads ?? []} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Unable to load user for telemetry history", error);
    redirect("/login");
  }
}
