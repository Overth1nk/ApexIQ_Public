import Link from "next/link";
import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

async function NavContent() {
  let isAuthenticated = false;

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  } catch (error) {
    console.warn("Unable to load Supabase session", error);
  }

  return (
    <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
      <Link
        className="transition hover:text-foreground"
        href="/"
      >
        Analyze
      </Link>
      <Link
        className="transition hover:text-foreground"
        href="/about"
      >
        About
      </Link>

      {isAuthenticated ? (
        <>
          <Link
            className="transition hover:text-foreground"
            href="/telemetry/history"
          >
            History
          </Link>
          <Link
            className="transition hover:text-foreground"
            href="/settings"
          >
            Settings
          </Link>
          <LogoutButton />
        </>
      ) : (
        <>
          <Link
            className="transition hover:text-foreground"
            href="/register"
          >
            Register
          </Link>
          <Link
            className="rounded-full bg-primary px-4 py-2 text-primary-foreground transition hover:bg-primary/90"
            href="/login"
          >
            Sign in
          </Link>
        </>
      )}
      <div className="w-px h-4 bg-border mx-1" />
      <ThemeToggle />
    </div>
  );
}

export async function TopNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <Link
          className="flex items-center gap-2 text-xl font-bold tracking-tighter text-foreground"
          href="/"
        >
          <span className="text-primary">Apex</span>IQ
        </Link>
        <Suspense fallback={<div className="h-9 w-28 rounded-full bg-muted animate-pulse" />}>
          <NavContent />
        </Suspense>
      </div>
    </header>
  );
}
