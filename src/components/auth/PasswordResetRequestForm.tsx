"use client";

import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Status =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

function getRedirectUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const url = new URL(siteUrl);
    url.pathname = "/auth/callback";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "http://localhost:3000/auth/callback";
  }
}

export function PasswordResetRequestForm() {
  const [status, setStatus] = useState<Status>(null);
  const [isPending, setIsPending] = useState(false);
  const redirectTo = useMemo(() => getRedirectUrl(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        setStatus({
          type: "error",
          message: error.message,
        });
        return;
      }

      setStatus({
        type: "success",
        message: "Check your inbox for the reset link.",
      });
      event.currentTarget.reset();
    } catch (error) {
      console.error("Password reset request failed", error);
      setStatus({
        type: "error",
        message: "We couldn't send the reset email right now. Try again later.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6 rounded-xl border border-zinc-200 bg-white/80 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Reset your password
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter the email associated with your account and we&apos;ll send you a link to choose a new password.
        </p>
      </div>

      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Email
        <input
          required
          type="email"
          name="email"
          placeholder="you@example.com"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-700"
        />
      </label>

      {status ? (
        <p
          className={`text-sm ${status.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
        >
          {status.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isPending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
