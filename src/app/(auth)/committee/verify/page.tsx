"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Loader2, AlertCircle, ShieldCheck, KeyRound } from "lucide-react";

export default function CommitteeVerifyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [committeeKey, setCommitteeKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/committee/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role === "COMMITTEE") {
      router.replace("/committee");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kc-blue-950">
        <Loader2 className="h-8 w-8 animate-spin text-kc-green-400" />
      </div>
    );
  }

  if (status !== "authenticated") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!committeeKey.trim()) {
      setError("Please enter the committee key.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/committee/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ committeeKey }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "Invalid committee key.");
      setLoading(false);
      return;
    }
    router.replace("/committee");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-kc-blue-950 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-kc-green-100 text-kc-green-600">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-kc-blue-950">
              Committee Key
            </h1>
            <p className="text-xs text-slate-500">
              Welcome, {session.user.name || session.user.email} — one more step.
            </p>
          </div>
        </div>

        <p className="rounded-xl bg-kc-blue-50 p-3 text-xs leading-relaxed text-kc-blue-800">
          Enter the <strong>Committee Key</strong> used by the KC Swimming Committee. This is an
          additional security layer on top of your login. It is verified securely on the server and
          never stored in the browser.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="committee-key" className="kc-label">
              Committee Key
            </label>
            <input
              id="committee-key"
              type="password"
              value={committeeKey}
              onChange={(e) => setCommitteeKey(e.target.value)}
              className="kc-input"
              placeholder="Enter the committee key"
              autoComplete="off"
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
                <Loader2 className="h-5 w-5 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                <KeyRound className="h-5 w-5" /> Enter committee dashboard
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/committee/verify" })}
          className="mt-3 w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600"
        >
          Authenticate with a different Google account
        </button>
      </div>
    </div>
  );
}