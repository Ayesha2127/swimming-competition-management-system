"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Plus, Trash2, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrokeRow {
  id: string;
  name: string;
  isActive: boolean;
}

export function StrokesManager({ initial }: { initial: StrokeRow[] }) {
  const router = useRouter();
  const [strokes, setStrokes] = useState(initial);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    const res = await fetch("/api/committee/strokes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "Could not add stroke.");
      return;
    }
    setName("");
    refresh();
  }

  async function toggle(s: StrokeRow) {
    await fetch("/api/committee/strokes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, isActive: !s.isActive }),
    });
    refresh();
  }

  async function remove(s: StrokeRow) {
    if (!confirm(`Remove stroke "${s.name}"?`)) return;
    const res = await fetch(`/api/committee/strokes?id=${s.id}`, { method: "DELETE" });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "Could not remove stroke.");
      return;
    }
    refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={add} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="kc-input flex-1"
          placeholder="New stroke name, e.g. Backstroke"
          aria-label="New stroke name"
        />
        <button type="submit" className="kc-btn-primary">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {strokes.map((s) => (
          <span
            key={s.id}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
              s.isActive ? "border-kc-blue-200 bg-kc-blue-50 text-kc-blue-900" : "border-slate-200 bg-slate-50 text-slate-400",
            )}
          >
            <Waves className="h-4 w-4" />
            {s.name}
            <button type="button" onClick={() => toggle(s)} className="text-slate-400 hover:text-kc-blue-600" aria-label={`Toggle ${s.name}`}>
              {s.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => remove(s)} className="text-slate-400 hover:text-red-600" aria-label={`Remove ${s.name}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}