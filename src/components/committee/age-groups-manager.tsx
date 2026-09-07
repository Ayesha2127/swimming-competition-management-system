"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgeGroupRow {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
  isActive: boolean;
  sortOrder: number;
}

export function AgeGroupsManager({ initial }: { initial: AgeGroupRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<AgeGroupRow[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", minAge: "", maxAge: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/committee/age-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        minAge: form.minAge === "" ? null : Number(form.minAge),
        maxAge: form.maxAge === "" ? null : Number(form.maxAge),
        isActive: true,
      }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error || "Could not add age group.");
      return;
    }
    setForm({ name: "", minAge: "", maxAge: "" });
    setCreating(false);
    refresh();
  }

  async function handleUpdate(id: string, data: Partial<AgeGroupRow>) {
    setError(null);
    const res = await fetch("/api/committee/age-groups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "Could not update age group.");
      return;
    }
    if (data.sortOrder === undefined) {
      setEditingId(null);
    }
    refresh();
  }

  async function handleToggleActive(row: AgeGroupRow) {
    setError(null);
    await PATCHSilent({ id: row.id, isActive: !row.isActive });
    refresh();
  }

  async function PATCHSilent(data: Record<string, unknown>) {
    await fetch("/api/committee/age-groups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove age group "${name}"? If it has been used historically it will be disabled instead of deleted.`)) return;
    const res = await fetch(`/api/committee/age-groups?id=${id}`, { method: "DELETE" });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "Could not remove age group.");
      return;
    }
    setNotice(body.deactivated ? `"${name}" was disabled (it has historical data).` : `"${name}" was deleted.`);
    refresh();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    await fetch("/api/committee/age-groups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((r) => r.id) }),
    });
    refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-kc-green-200 bg-kc-green-50 p-3 text-sm text-kc-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      <div className="kc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="kc-table min-w-[40rem]">
            <thead>
              <tr>
                <th className="w-8">Order</th>
                <th>Name</th>
                <th>Age range</th>
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
                    {editingId === row.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          className="kc-input !py-1.5 text-sm"
                          placeholder="Name"
                          aria-label="Age group name"
                        />
                        <button
                          type="button"
                          className="rounded-lg bg-kc-blue-600 p-2 text-white"
                          onClick={() =>
                            handleUpdate(row.id, {
                              name: form.name || row.name,
                              minAge: form.minAge === "" ? null : Number(form.minAge),
                              maxAge: form.maxAge === "" ? null : Number(form.maxAge),
                            })
                          }
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-kc-blue-950">{row.name}</span>
                    )}
                  </td>
                  <td className="text-slate-500">
                    {row.minAge === null && row.maxAge === null
                      ? "No restriction"
                      : `${row.minAge ?? 0}–${row.maxAge ?? "∞"} yrs`}
                  </td>
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
                          setForm({ name: row.name, minAge: row.minAge?.toString() ?? "", maxAge: row.maxAge?.toString() ?? "" });
                        }}
                        className="rounded-lg p-2 text-slate-500 hover:bg-kc-blue-50 hover:text-kc-blue-700"
                        aria-label={`Edit ${row.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id, row.name)}
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

      {creating && (
        <form onSubmit={handleCreate} className="kc-card flex flex-col gap-4 p-6 md:flex-row md:items-end">
          <div className="flex-1">
            <label htmlFor="new-ag-name" className="kc-label">
              Display name
            </label>
            <input
              id="new-ag-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="kc-input"
              placeholder="e.g. U-8"
            />
          </div>
          <div className="w-full md:w-32">
            <label htmlFor="new-ag-min" className="kc-label">
              Min age
            </label>
            <input
              id="new-ag-min"
              type="number"
              min={0}
              value={form.minAge}
              onChange={(e) => setForm((f) => ({ ...f, minAge: e.target.value }))}
              className="kc-input"
              placeholder="—"
            />
          </div>
          <div className="w-full md:w-32">
            <label htmlFor="new-ag-max" className="kc-label">
              Max age
            </label>
            <input
              id="new-ag-max"
              type="number"
              min={0}
              value={form.maxAge}
              onChange={(e) => setForm((f) => ({ ...f, maxAge: e.target.value }))}
              className="kc-input"
              placeholder="—"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="kc-btn-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="kc-btn-outline">
              Cancel
            </button>
          </div>
        </form>
      )}

      {!creating && (
        <button type="button" onClick={() => setCreating(true)} className="kc-btn-primary">
          <Plus className="h-4 w-4" /> Add age group
        </button>
      )}
    </div>
  );
}