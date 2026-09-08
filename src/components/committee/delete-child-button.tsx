"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteChildButton({ childId, childName }: { childId: string; childName: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/committee/my-children/${childId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/committee/my-children");
      }
    } catch {
      setDeleting(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
        <span className="text-red-700">Remove {childName}?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-300"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-red-300 hover:text-red-600 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" /> Remove
    </button>
  );
}
