"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Archive,
  Flag,
  Pencil,
  Plus,
  CalendarDays,
  MapPin,
  Users,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface CompetitionRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  venue: string | null;
  status: string;
  registrationEnabled: boolean;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  maxEventsPerParticipant: number | null;
  image: string | null;
  _count: { registrations: number; events: number; results: number };
}

export function CompetitionsList({ initial }: { initial: CompetitionRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, action: string, label: string) {
    setError(null);
    setBusyId(id);
    const res = await fetch("/api/committee/competitions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const body = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setError(body.error || "Action failed.");
      return;
    }
    setNotice(`${label}.`);
    router.refresh();
  }

  async function remove(row: CompetitionRow) {
    if (!confirm(`Delete competition "${row.name}"?`)) return;
    setBusyId(row.id);
    const res = await fetch(`/api/committee/competitions?id=${row.id}`, { method: "DELETE" });
    const body = await res.json();
    setBusyId(null);
    setError(res.ok ? null : body.error || "Could not delete.");
    setNotice(body.archived ? "Competition had registrations and was archived instead." : "Competition deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-kc-green-200 bg-kc-green-50 p-3 text-sm text-kc-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-kc-blue-100 bg-white/70 p-5">
        <div className="flex flex-wrap gap-2">
          {["DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => {
            const count = rows.filter((r) => r.status === s).length;
            return (
              <span key={s} className={cn("badge", s === "PUBLISHED" ? "badge-green" : s === "ARCHIVED" ? "badge-slate" : "badge-mint")}>
                {s} · {count}
              </span>
            );
          })}
        </div>
        <Link href="/committee/competitions/new" className="kc-btn-primary">
          <Plus className="h-4 w-4" /> New competition
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="kc-card p-10 text-center">
          <Flag className="mx-auto h-10 w-10 text-kc-blue-200" />
          <p className="mt-4 font-display text-xl font-bold uppercase text-kc-blue-950">No competitions yet</p>
          <p className="mt-1 text-sm text-slate-500">Create your first competition to open registrations.</p>
          <Link href="/committee/competitions/new" className="kc-btn-primary mt-6">
            <Plus className="h-4 w-4" /> Create competition
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div key={row.id} className="kc-card flex flex-col overflow-hidden">
              <div className="flex items-center justify-between bg-kc-blue-950 px-5 py-3">
                <span
                  className={cn("badge", row.status === "PUBLISHED" ? "badge-green" : row.status === "ARCHIVED" ? "badge-slate" : "badge-mint")}
                >
                  {row.status}
                </span>
                <span className={cn("badge", row.registrationEnabled ? "badge-green" : "badge-slate")}>
                  {row.registrationEnabled ? "Registration open" : "Registration closed"}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="font-display text-xl font-extrabold uppercase leading-tight text-kc-blue-950">{row.name}</h3>
                <div className="space-y-1 text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-kc-green-500" /> {formatDate(row.date)}
                  </p>
                  {row.venue && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-kc-green-500" /> {row.venue}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="badge badge-blue"><Users className="h-3 w-3" /> {row._count.registrations} registrations</span>
                  <span className="badge badge-blue">{row._count.events} events</span>
                  <span className="badge badge-blue">{row._count.results} results</span>
                </div>
                <div className="mt-auto pt-2">
                  <Link href={`/committee/competitions/${row.id}`} className="kc-btn-outline w-full">
                    Manage <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-sm">
                {row.status !== "PUBLISHED" && (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => act(row.id, "publish", "Published")}
                    className="text-kc-green-600 hover:underline disabled:opacity-40"
                  >
                    Publish
                  </button>
                )}
                {row.status === "PUBLISHED" && (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => act(row.id, row.registrationEnabled ? "close" : "open", row.registrationEnabled ? "Registrations closed" : "Registrations opened")}
                    className="text-kc-blue-600 hover:underline disabled:opacity-40"
                  >
                    {row.registrationEnabled ? "Close registration" : "Open registration"}
                  </button>
                )}
                {row.status !== "ARCHIVED" && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => act(row.id, "draft", "Moved to draft")}
                      className="text-kc-green-600 hover:underline disabled:opacity-40"
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => act(row.id, "archive", "Archived")}
                      className="text-slate-500 hover:underline disabled:opacity-40"
                    >
                      <Archive className="mr-1 inline h-3.5 w-3.5" />Archive
                    </button>
                  </>
                )}
                <Link
                  href={`/competitions/${row.slug}`}
                  className="text-slate-500 hover:text-kc-blue-700 hover:underline"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}