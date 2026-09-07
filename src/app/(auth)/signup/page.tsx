"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, AlertCircle, Eye, EyeOff, UserPlus, ShieldCheck, Info } from "lucide-react";
import { GoogleButton } from "@/components/google-button";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupInner />
    </Suspense>
  );
}

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/onboarding";

  const [role, setRole] = useState<"PARTICIPANT" | "PARENT">("PARENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) return setFormError("Please enter your full name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setFormError("Please enter a valid email address.");
    if (password.length < 8) return setFormError("Password must be at least 8 characters.");

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password, role }),
    });
    const body = await res.json();
    if (!res.ok) {
      setFormError(body.error || "Sign up failed. Please try again.");
      setLoading(false);
      return;
    }

    // Auto login
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (result?.error) {
      setFormError("Account created. Please log in with your new credentials.");
      router.push("/login");
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
        Create your account
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        One account for every KC swimming competition.
      </p>

      <div className="mt-6">
        <GoogleButton callbackUrl={callbackUrl} />
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">or sign up with email</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Account type */}
      <div className="mb-5">
        <p className="kc-label">I am a</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("PARENT")}
            className={cn(
              "rounded-xl border p-3 text-left transition-all duration-200",
              role === "PARENT"
                ? "border-kc-green-500 bg-kc-green-50 ring-1 ring-kc-green-500"
                : "border-slate-200 hover:border-kc-green-300",
            )}
            aria-pressed={role === "PARENT"}
          >
            <p className="text-sm font-bold text-kc-blue-950">Parent / Guardian</p>
            <p className="mt-0.5 text-xs text-slate-500">Register one or more children</p>
          </button>
          <button
            type="button"
            onClick={() => setRole("PARTICIPANT")}
            className={cn(
              "rounded-xl border p-3 text-left transition-all duration-200",
              role === "PARTICIPANT"
                ? "border-kc-green-500 bg-kc-green-50 ring-1 ring-kc-green-500"
                : "border-slate-200 hover:border-kc-green-300",
            )}
            aria-pressed={role === "PARTICIPANT"}
          >
            <p className="text-sm font-bold text-kc-blue-950">Swimmer</p>
            <p className="mt-0.5 text-xs text-slate-500">Managing your own profile</p>
          </button>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {role === "PARENT"
            ? "Your email and contact belong to you; competition data belongs to each child's swimmer profile."
            : "Your account connects to your permanent swimmer profile."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="signup-name" className="kc-label">
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="kc-input"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="signup-email" className="kc-label">
            Email address
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="kc-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="signup-phone" className="kc-label">
            Phone <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="signup-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="kc-input"
            placeholder="+92 3xx xxxxxxx"
          />
        </div>
        <div>
          <label htmlFor="signup-password" className="kc-label">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="kc-input pr-11"
              placeholder="At least 8 characters"
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
              <Loader2 className="h-5 w-5 animate-spin" /> Creating account...
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5" /> Create account
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link href="/login" className="font-bold text-kc-green-600 hover:text-kc-green-700 transition-colors">
          Log in
        </Link>
      </p>

      <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-kc-green-50 p-3 text-xs text-slate-600">
        <ShieldCheck className="h-4 w-4 text-kc-green-500" />
        <span>
          Committee member? Use the{" "}
          <Link href="/committee/login" className="font-bold text-kc-green-700 underline">
            committee login
          </Link>
        </span>
      </div>
    </div>
  );
}
