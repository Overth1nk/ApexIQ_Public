"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const signupConfirmed = useMemo(() => searchParams.get("signup") === "confirmed", [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.push("/telemetry/history");
      router.refresh();
    } catch (error) {
      console.error("Sign in failed", error);
      setErrorMessage("We couldn't sign you in. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card/80 p-8 shadow-sm backdrop-blur"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to keep refining your laps.
        </p>
      </div>

      {signupConfirmed ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
          Check your inbox to confirm your email, then sign in below.
        </p>
      ) : null}

      <div className="space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Email
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Password
          <input
            required
            type="password"
            name="password"
            minLength={6}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <Link className="font-medium text-foreground underline hover:text-primary" href="/register">
          Register
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        Forgot your password?{" "}
        <Link className="font-medium text-foreground underline hover:text-primary" href="/password/reset">
          Reset it here
        </Link>
        .
      </p>
    </form>
  );
}
