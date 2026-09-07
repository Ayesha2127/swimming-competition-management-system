"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Download, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { RegistrationLite } from "./competition-types";

const STATUS_COLORS: Record<string, string> = {
  REGISTERED: "badge-blue",
  CONFIRMED: "badge-green",
  PENDING: "badge-mint",
  CANCELLED: "badge-slate",
};

export function RegistrationsTab({
  competitionId,
  competitionName,
  competitionSlug,
  initialRegistrations,
}: {
  competitionId: string;
  competitionName: string;
  competitionSlug: string;
  initialRegistrations: RegistrationLite[];
}) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  function refresh() {
    window.location.reload();
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: registrations.length };
    for (const r of registrations) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [registrations]);

  const filtered = useMemo(
    () =>
      registrations.filter((r) => {
        if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          r.participant.fullName.toLowerCase().includes(q) ||
          r.participant.kcMembershipNumber.toLowerCase().includes(q) ||
          r.participant.phone.includes(q)
        );
      }),
    [registrations, statusFilter, search],
  );

  async function setStatus(regId: string, status: string) {
    setError(null);
    const res = await fetch(`/api/committee/competitions/${competitionId}/registrations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: regId, status }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "Could not update registration.");
      return;
    }
    refresh();
  }

  async function exportCsv() {
    setExporting(true);
    setError(null);
    try {
      const params = new URLSearchParams({ competitionId, format: "csv" });
      const res = await fetch(`/api/export?${params}`);
      if (!res.ok) {
        setError("Export failed.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${competitionSlug}-registrations.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function exportXlsx() {
    setExporting(true);
    setError(null);
    try {
      const params = new URLSearchParams({ competitionId, format: "xlsx" });
      const res = await fetch(`/api/export?${params}`);
      if (!res.ok) {
        setError("Export failed.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${competitionSlug}-registrations.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["ALL", "REGISTERED", "CONFIRMED", "PENDING", "CANCELLED"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm font-semibold",
                statusFilter === s ? "bg-kc-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {s.replace("_", " ")} · {counts[s] ?? 0}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportXlsx} disabled={exporting} className="kc-btn-primary">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button type="button" onClick={exportCsv} disabled={exporting} className="kc-btn-outline">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="kc-input max-w-md"
        placeholder="Search name, KC number or phone…"
        aria-label="Search registrations"
      />

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="kc-card p-10 text-center">
          <p className="font-display text-lg font-bold uppercase text-kc-blue-950">No registrations</p>
          <p className="mt-1 text-sm text-slate-500">Registrations submitted for {competitionName} will appear here.</p>
        </div>
      ) : (
        <div className="kc-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="kc-table min-w-[54rem]">
              <thead>
                <tr>
                  <th>Swimmer</th>
                  <th>KC #</th>
                  <th>Age group</th>
                  <th>Events</th>
                  <th>Registered</th>
                  <th>Status → change</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg) => (
                  <tr key={reg.id}>
                    <td>
                      <span className="font-semibold text-kc-blue-950">{reg.participant.fullName}</span>
                      <span className="block text-xs text-slate-400">{reg.participant.gender} · {reg.participant.phone}</span>
                    </td>
                    <td className="text-slate-500">{reg.participant.kcMembershipNumber}</td>
                    <td>{reg.ageGroup ? <span className="badge badge-blue">{reg.ageGroup.name}</span> : <span className="text-slate-400">—</span>}</td>
                    <td>
                      <div className="max-w-[14rem] space-y-0.5">
                        {reg.events.map((ev) => (
                          <span key={ev.id} className="block truncate text-xs text-slate-500" title={ev.competitionEvent.event.name}>
                            {ev.competitionEvent.event.name}
                            {ev.relayTeam ? ` · ${ev.relayTeam.name}` : ""}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-slate-500">{formatDate(reg.registeredAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={cn("badge", STATUS_COLORS[reg.status] ?? "badge-slate")}>{reg.status}</span>
                        {reg.status === "REGISTERED" && (
                          <button
                            type="button"
                            onClick={() => setStatus(reg.id, "CONFIRMED")}
                            className="rounded-lg bg-kc-green-600 px-2 py-1 text-xs text-white hover:bg-kc-green-700"
                          >
                            Confirm
                          </button>
                        )}
                        {reg.status === "CONFIRMED" && (
                          <button
                            type="button"
                            onClick={() => setStatus(reg.id, "REGISTERED")}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600"
                          >
                            Un-confirm
                          </button>
                        )}
                        {(reg.status === "REGISTERED" || reg.status === "CONFIRMED") && (
                          <button
                            type="button"
                            onClick={() => setStatus(reg.id, "CANCELLED")}
                            className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        )}
                        {reg.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => setStatus(reg.id, "CONFIRMED")}
                            className="rounded-lg bg-kc-green-600 px-2 py-1 text-xs text-white"
                          >
                            Approve
                          </button>
                        )}
                        {reg.status === "CANCELLED" && (
                          <button
                            type="button"
                            onClick={() => setStatus(reg.id, "REGISTERED")}
                            className="rounded-lg bg-kc-blue-600 px-2 py-1 text-xs text-white"
                          >
                            Reinstate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}