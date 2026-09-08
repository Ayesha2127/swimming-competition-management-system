"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function AddChildPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ageGroups, setAgeGroups] = useState<{ id: string; name: string }[]>([]);

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [kcMembershipNumber, setKcMembershipNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [ageGroupId, setAgeGroupId] = useState("");

  useEffect(() => {
    fetch("/api/committee/age-groups")
      .then((r) => r.json())
      .then((data) => setAgeGroups(data.ageGroups ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !dateOfBirth || !kcMembershipNumber.trim() || !phone.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/committee/my-children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          dateOfBirth,
          gender,
          kcMembershipNumber: kcMembershipNumber.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          ageGroupId: ageGroupId || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Something went wrong.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/committee/my-children"), 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-kc-green-200 bg-kc-green-50 p-10 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-kc-green-500" />
        <h3 className="font-display text-2xl font-bold uppercase text-kc-green-700">
          Child added!
        </h3>
        <p className="mt-2 text-sm text-slate-600">Redirecting to My Children...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/committee/my-children" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-kc-blue-600 hover:text-kc-blue-800">
        <ArrowLeft className="h-4 w-4" /> Back to My Children
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          Add Child
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill in the details below to add a child profile.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="fullName" className="kc-label">Full Name *</label>
            <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="kc-input" required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dob" className="kc-label">Date of Birth *</label>
              <input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="kc-input" required />
            </div>
            <div>
              <label htmlFor="gender" className="kc-label">Gender *</label>
              <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")} className="kc-input">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="kcNumber" className="kc-label">KC Membership Number *</label>
              <input id="kcNumber" type="text" value={kcMembershipNumber} onChange={(e) => setKcMembershipNumber(e.target.value)} className="kc-input" required />
            </div>
            <div>
              <label htmlFor="phone" className="kc-label">Phone *</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="kc-input" required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="kc-label">Email <span className="font-normal text-slate-400">(optional)</span></label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="kc-input" />
            </div>
            <div>
              <label htmlFor="ageGroup" className="kc-label">Age Group <span className="font-normal text-slate-400">(optional)</span></label>
              <select id="ageGroup" value={ageGroupId} onChange={(e) => setAgeGroupId(e.target.value)} className="kc-input">
                <option value="">Auto-calculate from DOB</option>
                {ageGroups.map((ag) => (
                  <option key={ag.id} value={ag.id}>{ag.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <button type="submit" disabled={submitting} className="kc-btn-primary !px-8 disabled:opacity-60">
            {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</> : "Add Child"}
          </button>
        </form>
      </div>
    </div>
  );
}
