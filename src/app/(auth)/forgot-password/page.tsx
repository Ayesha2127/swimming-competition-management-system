"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, KeyRound, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotInner />
    </Suspense>
  );
}

function ForgotInner() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ ok: boolean; link?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) return setError("Please enter your email address.");

    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error || "Something went wrong.");
      return;
    }
    setDone({ ok: true, link: body.devResetLink ?? undefined });
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-kc-blue-950/40">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-kc-blue-100 text-kc-blue-700">
          <KeyRound className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-kc-blue-950">
            Reset password
          </h1>
          <p className="text-xs text-slate-500">Recover access to your KC swimming account</p>
        </div>
      </div>

      {done?.ok ? (
        <div className="rounded-2xl border border-kc-green-200 bg-kc-green-50 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-kc-green-500" />
          <h2 className="font-display text-lg font-bold uppercase text-kc-green-700">
            Reset link ready
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            If an account exists for <strong>{email}</strong>, a reset link has been generated and
            printed to the server log for delivery.
          </p>
          {done.link && (
            <a
              href={done.link}
              className="mt-4 inline-block break-all rounded-xl bg-white px-4 py-3 text-xs font-semibold text-kc-blue-700 ring-1 ring-kc-green-200 hover:bg-kc-green-100"
            >
              {done.link}
            </a>
          )}
          <div className="mt-4">
            <Link href="/login" className="text-sm font-bold text-kc-blue-600 hover:underline">
              ← Back to login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fp-email" className="kc-label">
              Email address
            </label>
            <input
              id="fp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="kc-input"
              placeholder="you@example.com"
              autoComplete="email"
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
                <Loader2 className="h-5 w-5 animate-spin" /> Sending...
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" /> Send reset link
              </>
            )}
          </button>

          <p className="text-center text-sm text-slate-500">
            <Link href="/login" className="font-bold text-kc-blue-600 hover:underline">
              ← Back to login
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}