"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Save } from "lucide-react";
import type { CompetitionLite } from "./competition-types";

export function OverviewTab({ competition }: { competition: CompetitionLite }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: competition.name,
    description: competition.description ?? "",
    date: competition.date.slice(0, 10),
    venue: competition.venue ?? "",
    registrationOpensAt: competition.registrationOpensAt?.slice(0, 10) ?? "",
    registrationClosesAt: competition.registrationClosesAt?.slice(0, 10) ?? "",
    maxEventsPerParticipant: competition.maxEventsPerParticipant?.toString() ?? "",
    image: competition.image ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/committee/competitions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: competition.id,
        name: form.name,
        description: form.description || null,
        date: form.date,
        venue: form.venue || null,
        registrationOpensAt: form.registrationOpensAt || null,
        registrationClosesAt: form.registrationClosesAt || null,
        maxEventsPerParticipant: form.maxEventsPerParticipant ? Number(form.maxEventsPerParticipant) : null,
        image: form.image || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError((await res.json()).error || "Could not save.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="kc-card max-w-4xl space-y-5 p-6">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="o-name" className="kc-label">Name</label>
          <input
            id="o-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="kc-input"
          />
        </div>
        <div>
          <label htmlFor="o-date" className="kc-label">Date</label>
          <input
            id="o-date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="kc-input"
          />
        </div>
        <div>
          <label htmlFor="o-venue" className="kc-label">Venue</label>
          <input
            id="o-venue"
            type="text"
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            className="kc-input"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="o-desc" className="kc-label">Description</label>
          <textarea
            id="o-desc"
            rows={5}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="kc-input"
          />
        </div>
        <div>
          <label htmlFor="o-open" className="kc-label">Registration opens</label>
          <input
            id="o-open"
            type="date"
            value={form.registrationOpensAt}
            onChange={(e) => setForm((f) => ({ ...f, registrationOpensAt: e.target.value }))}
            className="kc-input"
          />
        </div>
        <div>
          <label htmlFor="o-close" className="kc-label">Registration closes</label>
          <input
            id="o-close"
            type="date"
            value={form.registrationClosesAt}
            onChange={(e) => setForm((f) => ({ ...f, registrationClosesAt: e.target.value }))}
            className="kc-input"
          />
        </div>
        <div>
          <label htmlFor="o-max" className="kc-label">Max events per swimmer</label>
          <input
            id="o-max"
            type="number"
            min={0}
            value={form.maxEventsPerParticipant}
            onChange={(e) => setForm((f) => ({ ...f, maxEventsPerParticipant: e.target.value }))}
            className="kc-input"
          />
          <p className="mt-1 text-xs text-slate-400">0 = no limit.</p>
        </div>
        <div>
          <label htmlFor="o-image" className="kc-label">Poster image path</label>
          <input
            id="o-image"
            type="text"
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            className="kc-input"
            placeholder="/images/events/{slug}/poster.jpg"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="kc-btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
        </button>
        {saved && <span className="text-sm font-semibold text-kc-green-600">Saved ✓</span>}
      </div>
    </form>
  );
}