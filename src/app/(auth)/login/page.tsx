"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import { GoogleButton } from "@/components/google-button";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!email || !password) {
      setFormError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (result?.error) {
      setFormError("Invalid email or password.");
      setLoading(false);
      return;
    }
    if (result?.url) {
      router.push(result.url);
      router.refresh();
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-kc-blue-950/10 ring-1 ring-slate-100">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-slate-500">Log in to your KC swimming account.</p>

      {(error === "OAuthAccountNotLinked" || error === "OAuthSignin" || error === "OAuthCallback") && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {error === "OAuthAccountNotLinked"
              ? "This Google account is linked to a different email. Please log in with that method."
              : "Google sign-in could not be completed. Please try again."}
          </span>
        </div>
      )}

      <div className="mt-6">
        <GoogleButton callbackUrl={callbackUrl} />
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="kc-label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="kc-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="kc-label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="kc-input pr-11"
              placeholder="Your password"
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
          <div className="mt-1.5 text-right">
            <Link href="/forgot-password" className="text-xs font-semibold text-kc-green-600 hover:text-kc-green-700 transition-colors">
              Forgot password?
            </Link>
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
              <Loader2 className="h-5 w-5 animate-spin" /> Logging in...
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" /> Login
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New to KC swimming?{" "}
        <Link href="/signup" className="font-bold text-kc-green-600 hover:text-kc-green-700 transition-colors">
          Create an account
        </Link>
      </p>

      <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-kc-green-50 p-3 text-xs text-slate-600">
        <ShieldCheck className="h-4 w-4 text-kc-green-500" />
        Your session stays logged in securely on this device.
      </div>
    </div>
  );
}
