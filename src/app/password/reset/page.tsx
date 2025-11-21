import { Suspense } from "react";
import { PasswordResetRequestForm } from "@/components/auth/PasswordResetRequestForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PasswordResetPage() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/settings");
    }
  } catch (error) {
    console.warn("Skipping auth check on password reset page", error);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-6 py-20 font-sans text-foreground sm:px-10">
      <Suspense fallback={<div className="h-64 w-full max-w-md rounded-2xl border border-border bg-card/80 shadow-sm" />}>
        <PasswordResetRequestForm />
      </Suspense>
    </div>
  );
}
