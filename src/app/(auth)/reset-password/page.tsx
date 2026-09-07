"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, KeyRound, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetInner />
    </Suspense>
  );
}

function ResetInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (!token || !email) return setError("This reset link is incomplete.");

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error || "Something went wrong.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-kc-green-500" />
        <h1 className="font-display text-2xl font-extrabold uppercase text-kc-green-700">
          Password updated
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          You can now log in with your new password.
        </p>
        <button type="button" onClick={() => router.push("/login")} className="kc-btn-primary mt-6 !w-full">
          Go to login
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-kc-blue-950/40">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-kc-green-100 text-kc-green-600">
          <KeyRound className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-kc-blue-950">
            Choose a new password
          </h1>
          <p className="text-xs text-slate-500">For {email || "your account"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="rp-password" className="kc-label">
            New password
          </label>
          <div className="relative">
            <input
              id="rp-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="kc-input pr-11"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="rp-confirm" className="kc-label">
            Confirm new password
          </label>
          <input
            id="rp-confirm"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="kc-input"
            placeholder="Repeat the password"
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="kc-btn-primary !w-full !py-3.5">
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Updating...
            </>
          ) : (
            "Update password"
          )}
        </button>

        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className="font-bold text-kc-blue-600 hover:underline">
            ← Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}