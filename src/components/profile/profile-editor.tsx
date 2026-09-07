"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface ProfileEditorProps {
  participant: {
    id: string;
    phone: string | null;
    email: string | null;
    ageGroupId: string | null;
  };
  ageGroups: { id: string; name: string; isActive: boolean }[];
}

export function ProfileEditor({ participant, ageGroups }: ProfileEditorProps) {
  const router = useRouter();
  const [phone, setPhone] = useState(participant.phone ?? "");
  const [email, setEmail] = useState(participant.email ?? "");
  const [ageGroupId, setAgeGroupId] = useState(participant.ageGroupId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    const res = await fetch("/api/participants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId: participant.id,
        phone,
        email,
        ageGroupId: ageGroupId || null,
      }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error || "Could not save changes.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="kc-card p-6" noValidate>
      <h2 className="font-display text-xl font-bold uppercase text-kc-blue-950">Edit details</h2>
      <p className="mt-1 text-sm text-slate-500">
        Update your contact information or age group for upcoming competitions.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pe-phone" className="kc-label">
            Phone
          </label>
          <input
            id="pe-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="kc-input"
          />
        </div>
        <div>
          <label htmlFor="pe-email" className="kc-label">
            Email
          </label>
          <input
            id="pe-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="kc-input"
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="pe-agegroup" className="kc-label">
          Age group
        </label>
        <select id="pe-agegroup" value={ageGroupId} onChange={(e) => setAgeGroupId(e.target.value)} className="kc-input">
          <option value="">Please select...</option>
          {ageGroups
            .filter((a) => a.isActive || a.id === participant.ageGroupId)
            .map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name}
              </option>
            ))}
        </select>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={loading} className="kc-btn-primary">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save changes"
          )}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-kc-green-600">
            <CheckCircle2 className="h-4 w-4" /> Changes saved
          </span>
        )}
      </div>
    </form>
  );
}