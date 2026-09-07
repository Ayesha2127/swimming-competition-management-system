"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Medal as MedalIcon, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompetitionEventLite, RegistrationLite, ResultLite } from "./competition-types";

const MEDAL_ORDER = ["NONE", "GOLD", "SILVER", "BRONZE"] as const;
const MEDAL_BADGE: Record<string, string> = {
  GOLD: "badge-mint",
  SILVER: "badge-slate",
  BRONZE: "badge-bronze",
  NONE: "badge-slate",
};

export function ResultsTab({
  competitionId,
  initialResults,
  competitionEvents,
  registrations,
}: {
  competitionId: string;
  initialResults: ResultLite[];
  competitionEvents: CompetitionEventLite[];
  registrations: RegistrationLite[];
}) {
  const [results, setResults] = useState(initialResults);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    competitionEventId: "",
    ageGroupId: "",
    registrationId: "",
    relayTeamId: "",
    time: "",
    position: "",
    medal: "NONE",
  });

  const teams = useMemo(() => {
    const map = new Map<string, { id: string; name: string; members: string }>();
    for (const reg of registrations) {
      for (const ev of reg.events) {
        if (ev.relayTeam) {
          map.set(ev.relayTeam.id, {
            id: ev.relayTeam.id,
            name: ev.relayTeam.name,
            members: ev.relayTeam.members.map((m) => m.fullName).join(", "),
          });
        }
      }
    }
    return Array.from(map.values());
  }, [registrations]);

  // Age groups referenced by this competition's registrations, used to tag results.
  const ageGroups = useMemo(() => {
    const map = new Map<string, string>();
    for (const reg of registrations) {
      if (reg.ageGroupId && reg.ageGroup) map.set(reg.ageGroupId, reg.ageGroup.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [registrations]);

  const registrationAgeGroup = (registrationId: string): string | null =>
    registrations.find((r) => r.id === registrationId)?.ageGroupId ?? null;

  function resetForm() {
    setForm({ competitionEventId: "", ageGroupId: "", registrationId: "", relayTeamId: "", time: "", position: "", medal: "NONE" });
  }

  async function api(data: unknown, method: string) {
    const res = await fetch("/api/committee/results", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return { ok: res.ok, body: await res.json() };
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { ok, body } = await api(
      {
        competitionId,
        competitionEventId: form.competitionEventId,
        ageGroupId: form.ageGroupId || null,
        registrationId: form.registrationId || null,
        relayTeamId: form.relayTeamId || null,
        time: form.time || null,
        position: form.position ? Number(form.position) : null,
        medal: form.medal,
      },
      "POST",
    );
    if (!ok) {
      setError(body.error || "Could not add result.");
      return;
    }
    resetForm();
    setShowForm(false);
    window.location.reload();
  }

  async function update(id: string) {
    setError(null);
    const { ok, body } = await api(
      {
        id,
        time: form.time || null,
        position: form.position ? Number(form.position) : null,
        medal: form.medal,
      },
      "PATCH",
    );
    if (!ok) setError(body.error || "Could not update result.");
    setEditingId(null);
    window.location.reload();
  }

  async function remove(id: string) {
    if (!confirm("Delete this result?")) return;
    await fetch(`/api/committee/results?id=${id}`, { method: "DELETE" });
    window.location.reload();
  }

  const grouped = useMemo(() => {
    const map = new Map<string, ResultLite[]>();
    for (const r of results) {
      const key = r.competitionEvent.id;
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return map;
  }, [results]);

  const displayName = (r: ResultLite) =>
    r.relayTeam
      ? `${r.relayTeam.name} (${r.relayTeam.members.map((m) => m.fullName).join(", ")})`
      : r.registration?.participant.fullName ?? "Unknown swimmer";

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {results.length} result{results.length === 1 ? "" : "s"} recorded. Results appear on the public
          competition page and on swimmer profiles.
        </p>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)} className="kc-btn-primary">
            <Plus className="h-4 w-4" /> Add result
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={create} className="kc-card grid gap-4 border-2 border-kc-blue-300 p-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label htmlFor="r-event" className="kc-label">Event</label>
            <select
              id="r-event"
              required
              value={form.competitionEventId}
              onChange={(e) => setForm((f) => ({ ...f, competitionEventId: e.target.value }))}
              className="kc-input"
            >
              <option value="">Select event…</option>
              {competitionEvents.map((ce) => (
                <option key={ce.id} value={ce.id}>
                  {ce.event.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="r-ag" className="kc-label">Age group (auto from swimmer)</label>
            <select
              id="r-ag"
              value={form.ageGroupId}
              onChange={(e) => setForm((f) => ({ ...f, ageGroupId: e.target.value }))}
              className="kc-input"
            >
              <option value="">Select…</option>
              {ageGroups.map((ag) => (
                <option key={ag.id} value={ag.id}>{ag.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="r-medal" className="kc-label">Medal</label>
            <select
              id="r-medal"
              value={form.medal}
              onChange={(e) => setForm((f) => ({ ...f, medal: e.target.value }))}
              className="kc-input"
            >
              {MEDAL_ORDER.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0) + m.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="r-reg" className="kc-label">Swimmer (optional)</label>
            <select
              id="r-reg"
              value={form.registrationId}
              onChange={(e) => {
                const regId = e.target.value;
                setForm((f) => ({
                  ...f,
                  registrationId: regId,
                  // Tag the result with the swimmer's age group automatically.
                  ageGroupId: regId ? (registrationAgeGroup(regId) ?? f.ageGroupId) : f.ageGroupId,
                }));
              }}
              className="kc-input"
            >
              <option value="">Individual swimmer…</option>
              {registrations.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.participant.fullName} ({reg.participant.kcMembershipNumber})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="r-team" className="kc-label">Relay team (optional)</label>
            <select
              id="r-team"
              value={form.relayTeamId}
              onChange={(e) => setForm((f) => ({ ...f, relayTeamId: e.target.value }))}
              className="kc-input"
            >
              <option value="">Relay team…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="r-time" className="kc-label">Time</label>
            <input
              id="r-time"
              type="text"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="kc-input"
              placeholder="e.g. 32.45"
            />
          </div>
          <div>
            <label htmlFor="r-pos" className="kc-label">Position</label>
            <input
              id="r-pos"
              type="number"
              min={1}
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              className="kc-input"
              placeholder="1"
            />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="kc-btn-primary">
              <Save className="h-4 w-4" /> Save result
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="kc-btn-outline">
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {results.length === 0 ? (
        <div className="kc-card p-10 text-center">
          <MedalIcon className="mx-auto h-10 w-10 text-kc-green-500" />
          <p className="mt-4 font-display text-lg font-bold uppercase text-kc-blue-950">No results recorded</p>
          <p className="mt-1 text-sm text-slate-500">Add results per event below once the competition has run.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([competitionEventId, list]) => {
            const eventName = list[0].competitionEvent.event.name;
            const sorted = [...list].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
            return (
              <div key={competitionEventId} className="kc-card overflow-hidden">
                <div className="border-b border-slate-100 bg-kc-blue-50/50 px-5 py-3">
                  <h4 className="font-display text-sm font-bold uppercase text-kc-blue-950">{eventName}</h4>
                </div>
                <table className="kc-table">
                  <thead>
                    <tr>
                      <th className="w-14">Pos</th>
                      <th>Swimmer / Team</th>
                      <th>Time</th>
                      <th>Medal</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => (
                      <tr key={r.id}>
                        <td className="font-semibold text-kc-blue-950">{r.position ?? "—"}</td>
                        <td>
                          <span className="font-medium text-kc-blue-950">{displayName(r)}</span>
                          {r.ageGroup && <span className="ml-2 badge badge-blue">{r.ageGroup.name}</span>}
                        </td>
                        <td className="text-slate-500">{r.time ?? "—"}</td>
                        <td>
                          <span className={cn("badge", MEDAL_BADGE[r.medal] ?? "badge-slate")}>
                            {r.medal === "NONE" ? "—" : r.medal}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(r.id);
                                setForm({
                                  competitionEventId: r.competitionEventId,
                                  ageGroupId: r.ageGroupId ?? "",
                                  registrationId: r.registrationId ?? "",
                                  relayTeamId: r.relayTeamId ?? "",
                                  time: r.time ?? "",
                                  position: r.position?.toString() ?? "",
                                  medal: r.medal,
                                });
                              }}
                              className="rounded-lg p-2 text-slate-500 hover:bg-kc-blue-50 hover:text-kc-blue-700"
                              aria-label="Edit result"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(r.id)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete result"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {editingId && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
                    <span className="text-sm font-semibold text-slate-600">Edit:</span>
                    <input
                      value={form.time}
                      onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                      className="kc-input w-28 !py-1.5 text-sm"
                      placeholder="Time"
                      aria-label="Time"
                    />
                    <input
                      value={form.position}
                      onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                      className="kc-input w-20 !py-1.5 text-sm"
                      placeholder="Pos"
                      aria-label="Position"
                    />
                    <select
                      value={form.medal}
                      onChange={(e) => setForm((f) => ({ ...f, medal: e.target.value }))}
                      className="kc-input w-32 !py-1.5 text-sm"
                      aria-label="Medal"
                    >
                      {MEDAL_ORDER.map((m) => (
                        <option key={m} value={m}>
                          {m.charAt(0) + m.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => update(editingId)} className="rounded-lg bg-kc-blue-600 px-3 py-1.5 text-sm text-white">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border px-3 py-1.5 text-sm">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}