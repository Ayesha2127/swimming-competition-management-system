"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, KeyRound } from "lucide-react";
import { GoogleButton } from "@/components/google-button";

export default function CommitteeLoginPage() {
  return (
    <Suspense>
      <CommitteeLoginInner />
    </Suspense>
  );
}

function CommitteeLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/committee/verify";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [committeeKey, setCommitteeKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (mode === "signup") {
      if (!name.trim()) return setFormError("Please enter your name.");
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          // Signup never grants committee access; the Committee Key must be
          // entered on the /committee/verify step before the role is elevated.
          role: "PARTICIPANT",
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setFormError(body.error || "Sign up failed. Please try again.");
        return;
      }
    }

    // Sign in (or create-then-log-in)
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/committee/verify",
    });

    if (result?.error) {
      setFormError(mode === "signup" ? "Account created — please log in." : "Invalid email or password.");
      setLoading(false);
      return;
    }
    router.push("/committee/verify");
    router.refresh();
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-kc-blue-950/40">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-kc-blue-100 text-kc-blue-700">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-kc-blue-950">
            Committee Access
          </h1>
          <p className="text-xs text-slate-500">Karachi Club Swimming Committee Members</p>
        </div>
      </div>

      <p className="rounded-xl bg-kc-green-50 p-3 text-xs leading-relaxed text-kc-green-800">
        Committee access requires the shared <strong>Committee Key</strong> as an additional security
        layer after authentication.
      </p>

      <div className="mt-5">
        <GoogleButton callbackUrl="/committee/verify" />
      </div>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Mode toggle */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-lg py-2 text-sm font-bold transition-colors ${mode === "login" ? "bg-white text-kc-blue-950 shadow-sm" : "text-slate-500"}`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-lg py-2 text-sm font-bold transition-colors ${mode === "signup" ? "bg-white text-kc-blue-950 shadow-sm" : "text-slate-500"}`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === "signup" && (
          <div>
            <label htmlFor="c-name" className="kc-label">
              Full name
            </label>
            <input id="c-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="kc-input" placeholder="Committee member name" />
          </div>
        )}
        <div>
          <label htmlFor="c-email" className="kc-label">
            Email address
          </label>
          <input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="kc-input" placeholder="you@karachiclub.com.pk" />
        </div>
        <div>
          <label htmlFor="c-password" className="kc-label">
            Password
          </label>
          <div className="relative">
            <input
              id="c-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="kc-input pr-11"
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
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

        {formError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        <button type="submit" disabled={loading} className="kc-btn-primary !w-full !py-3.5">
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Please wait...
            </>
          ) : (
            <>
              <KeyRound className="h-5 w-5" /> {mode === "login" ? "Continue" : "Create committee account"}
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        After authentication you will be asked for the Committee Key.
      </p>

      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/login" className="font-bold text-kc-blue-600 hover:underline">
          ← Back to participant login
        </Link>
      </p>
    </div>
  );
}