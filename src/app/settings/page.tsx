import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function SettingsPage() {
  let userEmail: string | null = null;

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    userEmail = user.email ?? null;
  } catch (error) {
    console.error("Unable to load user in settings", error);
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background px-6 py-16 font-sans sm:px-10">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account preferences and application settings.
          </p>
        </div>

        <div className="grid gap-8">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Appearance
            </h2>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Theme</h3>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Account
            </h2>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="grid gap-1">
                <h3 className="font-medium text-foreground">Email Address</h3>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Security
            </h2>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <PasswordChangeForm />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
