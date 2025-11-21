"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        router.push("/telemetry/history");
      } else {
        router.push("/login?signup=confirmed");
      }

      router.refresh();
    } catch (error) {
      console.error("Sign up failed", error);
      setErrorMessage("We couldn't complete your registration. Please try again.");
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
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start capturing and reviewing your racing telemetry.
        </p>
      </div>

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
            autoComplete="new-password"
            placeholder="Create a strong password"
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
        {isPending ? "Creating account…" : "Sign up"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-medium text-foreground underline hover:text-primary" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
