"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Check } from "lucide-react";

export function NewCompetitionForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    date: "",
    venue: "",
    registrationOpensAt: "",
    registrationClosesAt: "",
    registrationEnabled: false,
    maxEventsPerParticipant: "4",
    status: "DRAFT",
    image: "",
  });
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleName(name: string) {
    setForm((f) => ({ ...f, name }));
    setSlug(
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/committee/competitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: slug || undefined,
        description: form.description || null,
        date: form.date,
        venue: form.venue || null,
        registrationOpensAt: form.registrationOpensAt || null,
        registrationClosesAt: form.registrationClosesAt || null,
        registrationEnabled: form.registrationEnabled,
        maxEventsPerParticipant: form.maxEventsPerParticipant ? Number(form.maxEventsPerParticipant) : null,
        status: form.status,
        image: form.image || null,
      }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error || "Could not create competition.");
      return;
    }
    router.push(`/committee/competitions/${body.competition.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="kc-card max-w-4xl space-y-6 p-6 md:p-8">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="c-name" className="kc-label">Competition name</label>
          <input
            id="c-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => handleName(e.target.value)}
            className="kc-input"
            placeholder="e.g. KC Swimming Championship 2026"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="c-slug" className="kc-label">URL slug</label>
          <input
            id="c-slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="kc-input"
            placeholder="kc-swimming-championship-2026"
          />
          <p className="mt-1 text-xs text-slate-400">Auto-generated from the name; used in the public URL.</p>
        </div>

        <div>
          <label htmlFor="c-date" className="kc-label">Competition date</label>
          <input
            id="c-date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="kc-input"
          />
        </div>

        <div>
          <label htmlFor="c-venue" className="kc-label">Venue</label>
          <input
            id="c-venue"
            type="text"
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            className="kc-input"
            placeholder="Karachi Club Indoor Pool"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="c-desc" className="kc-label">Description</label>
          <textarea
            id="c-desc"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="kc-input"
            placeholder="Tell swimmers what this competition is about…"
          />
        </div>

        <div>
          <label htmlFor="c-open" className="kc-label">Registration opens</label>
          <input
            id="c-open"
            type="date"
            value={form.registrationOpensAt}
            onChange={(e) => setForm((f) => ({ ...f, registrationOpensAt: e.target.value }))}
            className="kc-input"
          />
        </div>

        <div>
          <label htmlFor="c-close" className="kc-label">Registration closes</label>
          <input
            id="c-close"
            type="date"
            value={form.registrationClosesAt}
            onChange={(e) => setForm((f) => ({ ...f, registrationClosesAt: e.target.value }))}
            className="kc-input"
          />
        </div>

        <div>
          <label htmlFor="c-max" className="kc-label">Max events per swimmer</label>
          <input
            id="c-max"
            type="number"
            min={0}
            max={50}
            value={form.maxEventsPerParticipant}
            onChange={(e) => setForm((f) => ({ ...f, maxEventsPerParticipant: e.target.value }))}
            className="kc-input"
          />
          <p className="mt-1 text-xs text-slate-400">0 = no limit.</p>
        </div>

        <div>
          <label htmlFor="c-image" className="kc-label">Poster image path</label>
          <input
            id="c-image"
            type="text"
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            className="kc-input"
            placeholder="/images/events/kcswim-2026/poster.jpg"
          />
        </div>

        <div className="md:col-span-2">
          <span className="kc-label">Status</span>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "DRAFT", label: "Draft (hidden)", hint: "Not visible to the public" },
              { value: "PUBLISHED", label: "Published", hint: "Visible on the website" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, status: opt.value }))}
                className={
                  form.status === opt.value
                    ? "rounded-xl border-2 border-kc-blue-600 bg-kc-blue-50 px-4 py-3 text-left"
                    : "rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-left hover:border-slate-300"
                }
              >
                <span className="flex items-center gap-2 font-semibold text-slate-800">
                  {form.status === opt.value && <Check className="h-4 w-4 text-kc-blue-600" />}
                  {opt.label}
                </span>
                <span className="block pl-6 text-xs text-slate-400">{opt.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-2 font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.registrationEnabled}
              onChange={(e) => setForm((f) => ({ ...f, registrationEnabled: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            Open registrations immediately
          </label>
          <p className="pl-6 text-xs text-slate-400">You can toggle this later from the competitions list.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="kc-btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create competition"}
        </button>
        <button type="button" onClick={() => router.push("/committee/competitions")} className="kc-btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}