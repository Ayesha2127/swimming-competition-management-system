"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventRow {
  id: string;
  name: string;
  distance: string;
  isRelay: boolean;
  relaySwimmers: number | null;
  genderType: string;
  isActive: boolean;
  sortOrder: number;
  stroke: { id: string; name: string } | null;
}

interface StrokeOption {
  id: string;
  name: string;
}

export function EventsManager({ initial, strokes }: { initial: EventRow[]; strokes: StrokeOption[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<EventRow[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    distance: "",
    strokeId: "",
    isRelay: false,
    relaySwimmers: "4",
    genderType: "OPEN",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function api(path: string, method: string, data: unknown) {
    const res = await fetch(`/api/committee/events${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    return { ok: res.ok, body };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { ok, body } = await api("", "POST", {
      name: form.name,
      distance: form.distance,
      strokeId: form.strokeId || null,
      isRelay: form.isRelay,
      relaySwimmers: form.isRelay ? Number(form.relaySwimmers) : null,
      genderType: form.genderType,
      isActive: true,
    });
    setLoading(false);
    if (!ok) {
      setError(body.error || "Could not add event.");
      return;
    }
    setForm({ name: "", distance: "", strokeId: "", isRelay: false, relaySwimmers: "4", genderType: "OPEN" });
    setCreating(false);
    refresh();
  }

  async function handleUpdate(id: string, data: Record<string, unknown>) {
    setError(null);
    const { ok, body } = await api("", "PATCH", { id, ...data });
    if (!ok) {
      setError(body.error || "Could not update event.");
      return;
    }
    setEditingId(null);
    refresh();
  }

  async function handleToggleActive(row: EventRow) {
    const { ok, body } = await api("", "PATCH", { id: row.id, isActive: !row.isActive });
    if (!ok) setError(body.error || "Could not update event.");
    refresh();
  }

  async function handleDelete(row: EventRow) {
    if (!confirm(`Remove event "${row.name}"? If it has been used in competitions it will be disabled.`)) return;
    const res = await fetch(`/api/committee/events?id=${row.id}`, { method: "DELETE" });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "Could not remove event.");
      return;
    }
    setNotice(body.deactivated ? `"${row.name}" was disabled (it is used in competitions).` : `"${row.name}" was deleted.`);
    refresh();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    await api("", "PATCH", { orderedIds: next.map((r) => r.id) });
    refresh();
  }

  const formFields = (
    <>
      <div className="flex-1">
        <label htmlFor="ev-name" className="kc-label">Event name</label>
        <input
          id="ev-name"
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="kc-input"
          placeholder="e.g. 100m Freestyle"
        />
      </div>
      <div className="w-full md:w-28">
        <label htmlFor="ev-distance" className="kc-label">Distance</label>
        <input
          id="ev-distance"
          type="text"
          value={form.distance}
          onChange={(e) => setForm((f) => ({ ...f, distance: e.target.value }))}
          className="kc-input"
          placeholder="e.g. 100"
        />
      </div>
      <div className="w-full md:w-48">
        <label htmlFor="ev-stroke" className="kc-label">Stroke</label>
        <select
          id="ev-stroke"
          value={form.strokeId}
          onChange={(e) => setForm((f) => ({ ...f, strokeId: e.target.value }))}
          className="kc-input"
        >
          <option value="">No stroke</option>
          {strokes.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-slate-600">
        <input
          type="checkbox"
          checked={form.isRelay}
          onChange={(e) => setForm((f) => ({ ...f, isRelay: e.target.checked }))}
          className="h-4 w-4"
        />
        Relay event
      </label>
      {form.isRelay && (
        <div className="w-28">
          <label htmlFor="ev-relay-n" className="kc-label">Swimmers</label>
          <input
            id="ev-relay-n"
            type="number"
            min={2}
            max={20}
            value={form.relaySwimmers}
            onChange={(e) => setForm((f) => ({ ...f, relaySwimmers: e.target.value }))}
            className="kc-input"
          />
        </div>
      )}
      <div className="w-36">
        <label htmlFor="ev-gender" className="kc-label">Gender</label>
        <select
          id="ev-gender"
          value={form.genderType}
          onChange={(e) => setForm((f) => ({ ...f, genderType: e.target.value }))}
          className="kc-input"
        >
          <option value="OPEN">Open</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="MIXED">Mixed</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-kc-green-200 bg-kc-green-50 p-3 text-sm text-kc-green-700">
          {notice}
        </div>
      )}

      <div className="kc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="kc-table min-w-[44rem]">
            <thead>
              <tr>
                <th className="w-8">Order</th>
                <th>Event</th>
                <th>Type</th>
                <th>Gender</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        className="text-slate-300 hover:text-kc-blue-600 disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === rows.length - 1}
                        className="text-slate-300 hover:text-kc-blue-600 disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className="font-semibold text-kc-blue-950">{row.name}</span>
                    <span className="block text-xs text-slate-400">{row.distance}m · {row.stroke?.name ?? "—"}</span>
                  </td>
                  <td>
                    <span className={cn("badge", row.isRelay ? "badge-mint" : "badge-blue")}>
                      {row.isRelay ? `Relay (${row.relaySwimmers ?? 4})` : "Individual"}
                    </span>
                  </td>
                  <td className="text-slate-500">{row.genderType}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(row)}
                      className={cn("badge", row.isActive ? "badge-green" : "badge-slate")}
                      aria-pressed={row.isActive}
                    >
                      {row.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {row.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(row.id);
                          setForm({
                            name: row.name,
                            distance: row.distance,
                            strokeId: row.stroke?.id ?? "",
                            isRelay: row.isRelay,
                            relaySwimmers: (row.relaySwimmers ?? 4).toString(),
                            genderType: row.genderType,
                          });
                        }}
                        className="rounded-lg p-2 text-slate-500 hover:bg-kc-blue-50 hover:text-kc-blue-700"
                        aria-label={`Edit ${row.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${row.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingId && (
        <div className="kc-card border-2 border-kc-blue-300 p-6">
          <h3 className="mb-4 font-display text-lg font-bold uppercase text-kc-blue-950">Edit event</h3>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            {formFields}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" className="kc-btn-primary" onClick={() => handleUpdate(editingId, {
              name: form.name,
              distance: form.distance,
              strokeId: form.strokeId || null,
              isRelay: form.isRelay,
              relaySwimmers: form.isRelay ? Number(form.relaySwimmers) : null,
              genderType: form.genderType,
            })}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </button>
            <button type="button" className="kc-btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
          </div>
        </div>
      )}

      {creating && (
        <form onSubmit={handleCreate} className="kc-card border-2 border-kc-blue-300 p-6">
          <h3 className="mb-4 font-display text-lg font-bold uppercase text-kc-blue-950">Add new event</h3>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            {formFields}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={loading} className="kc-btn-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add event"}
            </button>
            <button type="button" className="kc-btn-outline" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </form>
      )}

      {!creating && !editingId && (
        <button type="button" onClick={() => setCreating(true)} className="kc-btn-primary">
          <Plus className="h-4 w-4" /> Add event
        </button>
      )}
    </div>
  );
}