import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/telemetry/history");
    }
  } catch (error) {
    console.warn("Skipping auth check on login page", error);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-6 py-20 font-sans text-foreground sm:px-10">
      <Suspense fallback={<div className="h-40 w-full max-w-md rounded-2xl border border-border bg-card/80 shadow-sm" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
