"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { cn, calculateAge } from "@/lib/utils";
import { Gender } from "@prisma/client";

export interface AgeGroupOption {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
  isActive: boolean;
}

interface ParticipantFormProps {
  ageGroups: AgeGroupOption[];
  onSuccess?: () => void;
  submitLabel?: string;
  onRedirect?: string;
  defaultMemberNumber?: string;
}

export function ParticipantForm({
  ageGroups,
  onSuccess,
  submitLabel = "Save swimmer profile",
  onRedirect,
}: ParticipantFormProps) {
  const router = useRouter();
  const activeAgeGroups = ageGroups.filter((a) => a.isActive);

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender>(Gender.FEMALE);
  const [kcMembershipNumber, setKcMembershipNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [ageGroupId, setAgeGroupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const computedAge = useMemo(() => {
    if (!dateOfBirth) return null;
    const age = calculateAge(dateOfBirth);
    return isNaN(age) ? null : age;
  }, [dateOfBirth]);

  // Auto-suggest age group from age if age group not already selected
  const suggestAgeGroup = useMemo(() => {
    if (ageGroupId || computedAge === null) return null;
    return (
      activeAgeGroups
        .filter((a) => (a.minAge === null || computedAge >= a.minAge) && (a.maxAge === null || computedAge <= a.maxAge))
        .sort((a, b) => (a.minAge ?? 0) - (b.minAge ?? 0))[0] ?? null
    );
  }, [ageGroupId, computedAge, activeAgeGroups]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError("Please enter the full name.");
    if (!dateOfBirth) return setError("Please select a date of birth.");
    if (!kcMembershipNumber.trim()) return setError("Please enter the KC Membership Number.");

    setLoading(true);
    const res = await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        dateOfBirth,
        gender,
        kcMembershipNumber,
        phone,
        email,
        ageGroupId: ageGroupId || suggestAgeGroup?.id || null,
      }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error || "Something went wrong. Please try again.");
      return;
    }
    setSuccess(true);
    router.refresh();
    onSuccess?.();
    if (onRedirect) {
      setTimeout(() => router.push(onRedirect), 900);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-kc-green-200 bg-kc-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-kc-green-500" />
        <h3 className="font-display text-xl font-bold uppercase text-kc-green-700">Profile saved</h3>
        <p className="mt-2 text-sm text-slate-600">
          {fullName}&apos;s permanent swimmer profile has been created and is ready for competition
          registrations.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="pf-name" className="kc-label">
          Swimmer full name
        </label>
        <input
          id="pf-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="kc-input"
          placeholder="e.g. Sana Rahman"
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-dob" className="kc-label">
            Date of birth
          </label>
          <input
            id="pf-dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="kc-input"
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div>
          <label className="kc-label">Gender</label>
          <div className="grid grid-cols-2 gap-2">
            {[Gender.MALE, Gender.FEMALE].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-bold capitalize transition-all",
                  gender === g
                    ? "border-kc-blue-600 bg-kc-blue-50 text-kc-blue-800 ring-1 ring-kc-blue-600"
                    : "border-slate-200 text-slate-500 hover:border-kc-blue-300",
                )}
                aria-pressed={gender === g}
              >
                {g.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {computedAge !== null && (
        <p className="rounded-xl bg-kc-blue-50 px-4 py-2.5 text-sm font-semibold text-kc-blue-800">
          Age: <span className="font-display text-lg">{computedAge}</span> years
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-membership" className="kc-label">
            KC Membership Number
          </label>
          <input
            id="pf-membership"
            type="text"
            value={kcMembershipNumber}
            onChange={(e) => setKcMembershipNumber(e.target.value)}
            className="kc-input"
            placeholder="e.g. KC-2021-1187"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="pf-phone" className="kc-label">
            Phone
          </label>
          <input
            id="pf-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="kc-input"
            placeholder="+92 3xx xxxxxxx"
            autoComplete="tel"
          />
        </div>
      </div>

      <div>
        <label htmlFor="pf-email" className="kc-label">
          Email <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id="pf-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="kc-input"
          placeholder="swimmer@example.com"
        />
      </div>

      <div>
        <label htmlFor="pf-agegroup" className="kc-label">
          Age group
        </label>
        <select
          id="pf-agegroup"
          value={ageGroupId}
          onChange={(e) => setAgeGroupId(e.target.value)}
          className="kc-input"
        >
          <option value="">{suggestAgeGroup ? `Recommended: ${suggestAgeGroup.name}` : "Please select..."}</option>
          {activeAgeGroups.map((ag) => (
            <option key={ag.id} value={ag.id}>
              {ag.name}
              {ag.minAge !== null && ag.maxAge !== null
                ? ` (${ag.minAge}-${ag.maxAge} yrs)`
                : ag.minAge !== null
                  ? ` (${ag.minAge}+ yrs)`
                  : ""}
            </option>
          ))}
        </select>
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
            <Loader2 className="h-5 w-5 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Plus className="h-5 w-5" /> {submitLabel}
          </>
        )}
      </button>
    </form>
  );
}