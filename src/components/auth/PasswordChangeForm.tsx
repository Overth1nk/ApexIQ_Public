"use client";

import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Status =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

export function PasswordChangeForm() {
  const [status, setStatus] = useState<Status>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (newPassword.length < 6) {
      setStatus({
        type: "error",
        message: "Password must be at least 6 characters long.",
      });
      setIsPending(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({
        type: "error",
        message: "Passwords do not match.",
      });
      setIsPending(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setStatus({
          type: "error",
          message: error.message,
        });
        return;
      }

      event.currentTarget.reset();
      setStatus({
        type: "success",
        message: "Password updated successfully.",
      });
    } catch (error) {
      console.error("Password update failed", error);
      setStatus({
        type: "error",
        message: "Unable to update password right now. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card/85 p-6 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Change password
        </h3>
        <p className="text-sm text-muted-foreground">
          Set a new password for your account.
        </p>
      </div>

      <label className="block text-sm font-medium text-foreground">
        New password
        <input
          required
          type="password"
          name="newPassword"
          minLength={6}
          placeholder="Enter a new password"
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <label className="block text-sm font-medium text-foreground">
        Confirm password
        <input
          required
          type="password"
          name="confirmPassword"
          minLength={6}
          placeholder="Repeat the password"
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>

      {status ? (
        <p
          className={`text-sm ${status.type === "success" ? "text-emerald-600" : "text-rose-600"}`}
        >
          {status.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
