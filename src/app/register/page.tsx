import { SignupForm } from "@/components/auth/SignupForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/telemetry/history");
    }
  } catch (error) {
    console.warn("Skipping auth check on register page", error);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-6 py-20 font-sans text-foreground sm:px-10">
      <SignupForm />
    </div>
  );
}
