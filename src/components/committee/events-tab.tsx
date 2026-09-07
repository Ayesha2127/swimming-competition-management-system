"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompetitionEventLite, EventLite } from "./competition-types";

export function EventsTab({
  competitionId,
  initialEvents,
  allEvents,
  ageGroups,
}: {
  competitionId: string;
  initialEvents: CompetitionEventLite[];
  allEvents: EventLite[];
  ageGroups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [selected, setSelected] = useState("");
  const [eligibilityOpen, setEligibilityOpen] = useState<string | null>(null);
  const [pendingAges, setPendingAges] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function attach(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selected) return;
    const res = await fetch("/api/committee/competitions/[id]/events".replace("[id]", competitionId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competitionId, eventId: selected }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || (body.deactivated ? "Event is used elsewhere." : "Could not attach event."));
      return;
    }
    setSelected("");
    refresh();
  }

  async function toggleEnabled(ce: CompetitionEventLite) {
    const res = await fetch(`/api/committee/competitions/${competitionId}/events`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competitionId, competitionEventId: ce.id, isEnabled: !ce.isEnabled }),
    });
    if (!res.ok) setError("Could not update event state.");
    refresh();
  }

  async function saveEligibility(ce: CompetitionEventLite) {
    const res = await fetch(`/api/committee/competitions/${competitionId}/events`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competitionId, competitionEventId: ce.id, ageGroupIds: pendingAges }),
    });
    setEligibilityOpen(null);
    if (!res.ok) setError("Could not save eligibility.");
    refresh();
  }

  async function remove(ce: CompetitionEventLite) {
    if (!confirm(`Remove "${ce.event.name}" from this competition?`)) return;
    const res = await fetch(`/api/committee/competitions/${competitionId}/events?id=${ce.id}`, { method: "DELETE" });
    const body = await res.json();
    if (!res.ok) setError(body.error || "Could not remove event.");
    refresh();
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= events.length) return;
    const next = [...events];
    [next[index], next[target]] = [next[target], next[index]];
    setEvents(next);
    await fetch(`/api/committee/competitions/${competitionId}/events`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competitionId, orderedIds: next.map((e) => e.id) }),
    });
    refresh();
  }

  const unattached = allEvents.filter((ev) => !events.some((ce) => ce.eventId === ev.id));

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={attach} className="kc-card flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="attach-event" className="kc-label">Add event from catalog</label>
          <select id="attach-event" value={selected} onChange={(e) => setSelected(e.target.value)} className="kc-input">
            <option value="">Select an event…</option>
            {unattached.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} {ev.isRelay ? `(Relay ${ev.relaySwimmers})` : ""}
              </option>
            ))}
          </select>
          {unattached.length === 0 && (
            <p className="mt-1 text-xs text-slate-400">All catalog events are attached. Add more from the Events section.</p>
          )}
        </div>
        <button type="submit" disabled={!selected} className="kc-btn-primary">
          <Plus className="h-4 w-4" /> Attach
        </button>
      </form>

      {events.length === 0 ? (
        <div className="kc-card p-8 text-center">
          <p className="font-display text-lg font-bold uppercase text-kc-blue-950">No events attached</p>
          <p className="mt-1 text-sm text-slate-500">Attach events from the catalog above and set which age groups are eligible.</p>
        </div>
      ) : (
        <div className="kc-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="kc-table min-w-[42rem]">
              <thead>
                <tr>
                  <th className="w-8">Order</th>
                  <th>Event</th>
                  <th>Eligible age groups</th>
                  <th>State</th>
                  <th className="text-right">Remove</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ce, index) => {
                  const selectedAges = ce.ageGroups.map((ag) => ag.ageGroup.id);
                  const isOpen = eligibilityOpen === ce.id;
                  return (
                    <tr key={ce.id}>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                            className="text-slate-300 hover:text-kc-blue-600 disabled:opacity-30"
                            aria-label="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(index, 1)}
                            disabled={index === events.length - 1}
                            className="text-slate-300 hover:text-kc-blue-600 disabled:opacity-30"
                            aria-label="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="font-semibold text-kc-blue-950">{ce.event.name}</span>
                        <span className="block text-xs text-slate-400">
                          {ce.event.distance}m · {ce.event.stroke?.name ?? "—"} · {ce.event.genderType}
                          {ce.event.isRelay ? ` · Relay (${ce.event.relaySwimmers})` : ""}
                        </span>
                      </td>
                      <td>
                        {isOpen ? (
                          <div className="space-y-2">
                            <div className="flex max-w-[18rem] flex-wrap gap-1">
                              {ageGroups.map((ag) => {
                                const active = pendingAges.includes(ag.id);
                                return (
                                  <button
                                    key={ag.id}
                                    type="button"
                                    onClick={() =>
                                      setPendingAges((p) => (active ? p.filter((x) => x !== ag.id) : [...p, ag.id]))
                                    }
                                    className={cn("badge", active ? "badge-green" : "badge-slate")}
                                  >
                                    {active && <Check className="h-3 w-3" />} {ag.name}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => saveEligibility(ce)}
                                className="rounded-lg bg-kc-blue-600 px-3 py-1 text-xs text-white"
                              >
                                Save eligibility
                              </button>
                              <button
                                type="button"
                                onClick={() => setEligibilityOpen(null)}
                                className="rounded-lg border px-3 py-1 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" className="text-left text-sm text-slate-500 hover:text-kc-blue-600" onClick={() => {
                            setEligibilityOpen(ce.id);
                            setPendingAges(selectedAges);
                          }}>
                            {selectedAges.length === 0 ? (
                              <span className="italic text-slate-400">All age groups</span>
                            ) : (
                              ce.ageGroups.map((ag) => ag.ageGroup.name).join(", ")
                            )}{" "}
                            <ChevronDown className="inline h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleEnabled(ce)}
                          className={cn("badge", ce.isEnabled ? "badge-green" : "badge-slate")}
                          aria-pressed={ce.isEnabled}
                        >
                          {ce.isEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {ce.isEnabled ? "Enabled" : "Disabled"}
                        </button>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => remove(ce)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${ce.event.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}