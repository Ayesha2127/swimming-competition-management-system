import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCommittee } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/utils";
import {
  Users,
  ClipboardList,
  Trophy,
  Plus,
  ArrowRight,
  CalendarClock,
  FileText,
  Layers,
} from "lucide-react";

export default async function CommitteeDashboardPage() {
  await requireCommittee();

  const [participantCount, registrationCount, activeCompetitions, recentRegistrations, documentCount] =
    await Promise.all([
      prisma.participant.count(),
      prisma.registration.count(),
      prisma.competition.findMany({
        where: { status: { in: ["DRAFT", "PUBLISHED"] } },
        orderBy: { date: "asc" },
        take: 5,
        include: { _count: { select: { registrations: true, events: true } } },
      }),
      prisma.registration.findMany({
        orderBy: { registeredAt: "desc" },
        take: 6,
        include: { participant: { select: { fullName: true, ageGroup: true } }, competition: { select: { name: true } } },
      }),
      prisma.document.count(),
    ]);

  const publishedCount = activeCompetitions.filter((c) => c.status === "PUBLISHED").length;
  const draftCount = activeCompetitions.length - publishedCount;

  const stats = [
    { label: "Total participants", value: participantCount, icon: Users, href: "/committee/participants", color: "bg-kc-blue-600" },
    { label: "Total registrations", value: registrationCount, icon: ClipboardList, href: "/committee/registrations", color: "bg-kc-green-500" },
    { label: "Published competitions", value: publishedCount, sub: `${draftCount} in draft`, icon: Trophy, href: "/committee/competitions", color: "bg-kc-green-600" },
    { label: "Documents", value: documentCount, icon: FileText, href: "/committee/documents", color: "bg-slate-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
            Committee Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage competitions, registrations, participants, and committees — all from this screen.
          </p>
        </div>
        <Link href="/committee/competitions/new" className="kc-btn-primary shrink-0">
          <Plus className="h-4 w-4" /> New competition
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="kc-card group relative p-5 shadow-sm hover:-translate-y-1 hover:shadow-xl hover:ring-1 hover:ring-kc-blue-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.color} text-white shadow-md`}>
                <stat.icon className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-kc-blue-600 transition-colors" />
            </div>
            <p className="mt-4 font-display text-4xl font-extrabold text-kc-blue-950">{stat.value}</p>
            <p className="text-sm font-bold text-slate-700">{stat.label}</p>
            {stat.sub && <p className="text-xs text-slate-400">{stat.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent registrations */}
        <section className="kc-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-kc-blue-950">
              Recent registrations
            </h2>
            <Link href="/committee/registrations" className="text-xs font-bold text-kc-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentRegistrations.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">
              No registrations yet. Registrations appear here automatically.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentRegistrations.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-bold text-kc-blue-950">{reg.participant.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {reg.competition.name} · {reg.participant.ageGroup?.name ?? "—"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{formatDate(reg.registeredAt)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming competitions */}
        <section className="kc-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-kc-blue-950">
              Active competitions
            </h2>
            <Link href="/committee/competitions" className="text-xs font-bold text-kc-blue-600 hover:underline">
              Manage
            </Link>
          </div>
          {activeCompetitions.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No active competitions.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeCompetitions.map((competition) => (
                <Link
                  key={competition.id}
                  href={`/committee/competitions/${competition.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-kc-blue-50/50 transition-colors"
                >
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-kc-blue-950">
                      <CalendarClock className="h-4 w-4 text-kc-blue-500" />
                      {competition.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(competition.date)} · {competition._count.events} events ·{" "}
                      {competition._count.registrations} registered
                    </p>
                  </div>
                  <span className={`badge ${competition.status === "PUBLISHED" ? "badge-green" : "badge-slate"}`}>
                    {competition.status === "PUBLISHED" ? "Published" : "Draft"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* No-code management hint */}
      <div className="rounded-2xl border border-kc-blue-200 bg-kc-blue-50 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase text-kc-blue-950">
          <Layers className="h-5 w-5 text-kc-blue-600" /> Everything configurable — no code required
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Create and edit competitions, set registration windows, manage age groups and events,
          attach gallery photos, publish results, and organize committee documents — all through the
          dashboard. No developer or code changes are needed for routine competition work.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { href: "/committee/competitions", label: "Competitions" },
            { href: "/committee/events", label: "Events" },
            { href: "/committee/age-groups", label: "Age Groups" },
            { href: "/committee/results", label: "Results" },
            { href: "/committee/documents", label: "Documents" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="kc-btn-outline !px-4 !py-2 text-xs">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
