"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ChevronUp, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import type { RuleLite } from "./competition-types";

export function RulesTab({ initialRules, competitionId }: { initialRules: RuleLite[]; competitionId: string }) {
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);
  const [form, setForm] = useState({ title: "", content: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function api(data: unknown, method: string) {
    const res = await fetch("/api/committee/competitions/rules", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return { ok: res.ok, body: await res.json() };
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { ok, body } = await api({ competitionId, title: form.title || null, content: form.content, sortOrder: rules.length + 1 }, "POST");
    setLoading(false);
    if (!ok) {
      setError(body.error || "Could not add rule.");
      return;
    }
    setForm({ title: "", content: "" });
    setShowForm(false);
    refresh();
  }

  async function update(id: string, data: Record<string, unknown>) {
    setError(null);
    const { ok, body } = await api({ id, ...data }, "PATCH");
    if (!ok) setError(body.error || "Could not update rule.");
    setEditingId(null);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this rule?")) return;
    const res = await fetch(`/api/committee/competitions/rules?id=${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rules.length) return;
    const next = [...rules];
    [next[index], next[target]] = [next[target], next[index]];
    setRules(next);
    await api({ orderedIds: next.map((r) => r.id) }, "PATCH");
    refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {rules.length === 0 && !showForm && (
        <div className="kc-card p-8 text-center">
          <p className="font-display text-lg font-bold uppercase text-kc-blue-950">No rules yet</p>
          <p className="mt-1 text-sm text-slate-500">Add eligibility, format and conduct rules for this competition.</p>
        </div>
      )}

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div key={rule.id} className="kc-card flex flex-col gap-3 p-5 md:flex-row md:items-start">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="shrink-0 text-slate-300 hover:text-kc-blue-600 disabled:opacity-30 md:mt-1"
              aria-label="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <div className="flex-1">
              {editingId === rule.id ? (
                <div className="space-y-2">
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="kc-input !py-1.5 text-sm font-semibold"
                    placeholder="Rule title (optional)"
                    aria-label="Rule title"
                  />
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    className="kc-input text-sm"
                    rows={3}
                    placeholder="Rule text…"
                    aria-label="Rule content"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-kc-blue-600 px-3 py-1.5 text-sm text-white"
                      onClick={() => update(rule.id, { title: form.title || null, content: form.content })}
                    >
                      Save
                    </button>
                    <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {rule.title && <h4 className="font-display text-sm font-bold uppercase text-kc-blue-950">{rule.title}</h4>}
                  <p className="text-sm leading-relaxed text-slate-600">{rule.content}</p>
                </>
              )}
            </div>
            <div className="flex shrink-0 gap-1 md:mt-1">
              <button
                type="button"
                onClick={() => {
                  setEditingId(rule.id);
                  setForm({ title: rule.title ?? "", content: rule.content });
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-kc-blue-50 hover:text-kc-blue-700"
                aria-label="Edit rule"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(rule.id)}
                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete rule"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={create} className="kc-card space-y-3 border-2 border-kc-blue-300 p-5">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="kc-input"
            placeholder="Rule title (optional, e.g. Eligibility)"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className="kc-input"
            rows={3}
            required
            placeholder="Rule text…"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="kc-btn-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add rule"}
            </button>
            <button type="button" className="kc-btn-outline" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setShowForm(true)} className="kc-btn-primary">
          <Plus className="h-4 w-4" /> Add rule
        </button>
      )}
    </div>
  );
}