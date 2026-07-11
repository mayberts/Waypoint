"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Logo } from "@/components/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ configured: boolean }>("/api/auth/status").then((r) => setConfigured(r.configured));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!configured && password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(configured ? "/api/auth/login" : "/api/auth/setup", { username, password });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (configured === null) {
    return <p className="text-sm text-[var(--text-faint)]">Loading…</p>;
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 pb-2">
        <Logo size={36} />
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Waypoint</h1>
        <p className="text-sm text-[var(--text-faint)]">{configured ? "Sign in to continue" : "Create your account"}</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--text-faint)]">Username</label>
        <input
          autoFocus
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-stronger)]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--text-faint)]">Password</label>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={configured ? undefined : 8}
          className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-stronger)]"
        />
      </div>

      {!configured && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--text-faint)]">Confirm password</label>
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-stronger)]"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-3 py-2 text-sm rounded-md bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)] disabled:opacity-50"
      >
        {submitting ? "Please wait…" : configured ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--surface-1)]">
      <Suspense fallback={<p className="text-sm text-[var(--text-faint)]">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
