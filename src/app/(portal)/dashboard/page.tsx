import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireParentOrParticipant } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { isRegistrationOpen, formatDate } from "@/lib/utils";
import {
  Users,
  ClipboardList,
  Trophy,
  ArrowRight,
  Waves,
  CalendarDays,
  Medal,
  UserPlus,
} from "lucide-react";

export default async function DashboardOverviewPage() {
  const session = await requireParentOrParticipant();
  const userId = session.user.id;
  const isParent = session.user.role === UserRole.PARENT;

  const own = await prisma.participant.findUnique({
    where: { userId },
    include: { ageGroup: true },
  });
  const children = await prisma.parentChild.findMany({
    where: { parentUserId: userId },
    include: { participant: { include: { ageGroup: true } } },
  });

  const swimmers = isParent ? children.map((c) => c.participant) : own ? [own] : [];

  const registrations = await prisma.registration.findMany({
    where: {
      participant: {
        OR: [{ userId }, { parentLinks: { some: { parentUserId: userId } } }],
      },
    },
    include: {
      competition: { select: { name: true, slug: true, date: true, status: true, registrationEnabled: true, registrationOpensAt: true, registrationClosesAt: true } },
      participant: { select: { fullName: true, ageGroup: true } },
      events: { include: { competitionEvent: { include: { event: true } } } },
      results: true,
    },
    orderBy: { registeredAt: "desc" },
  });

  const openCompetitions = await prisma.competition.findMany({
    where: { status: "PUBLISHED" },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { date: "asc" },
    take: 4,
  });

  const upcomingRegs = registrations.filter((r) => r.competition.status === "PUBLISHED");
  const pastRegs = registrations.filter((r) => r.competition.status === "ARCHIVED");
  const resultsCount = registrations.reduce((n, r) => n + r.results.length, 0);

  const stats = [
    {
      label: isParent ? "My swimmers" : "My profile",
      value: swimmers.length,
      icon: Users,
      href: isParent ? "/dashboard/children" : "/dashboard/profile",
      color: "bg-kc-blue-600",
      sub: isParent ? "linked children" : "swimmer profile",
    },
    {
      label: "Active registrations",
      value: upcomingRegs.length,
      icon: ClipboardList,
      href: "/dashboard/registrations",
      color: "bg-kc-green-500",
      sub: "upcoming competitions",
    },
    {
      label: "Results & medals",
      value: resultsCount,
      icon: Medal,
      href: "/dashboard/results",
      color: "bg-kc-green-500",
      sub: "recorded results",
    },
    {
      label: "Past competitions",
      value: pastRegs.length,
      icon: Trophy,
      href: "/dashboard/results",
      color: "bg-slate-500",
      sub: "completed",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isParent ? "Manage your children, registrations, and results." : "Manage your swimmer profile, registrations, and results."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="kc-card group p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.color} text-white`}>
                <stat.icon className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-kc-blue-600 transition-colors" />
            </div>
            <p className="mt-4 font-display text-4xl font-extrabold text-kc-blue-950">{stat.value}</p>
            <p className="text-sm font-bold text-slate-700">{stat.label}</p>
            <p className="text-xs text-slate-400">{stat.sub}</p>
          </Link>
        ))}
      </div>

      {/* Missing profile banner */}
      {swimmers.length === 0 && (
        <div className="rounded-2xl border border-kc-green-300 bg-kc-green-50 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold uppercase text-kc-green-800">
                {isParent ? "Add your first child" : "Complete your profile"}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-slate-600">
                You need at least one permanent swimmer profile before you can register for any
                competition.
              </p>
            </div>
            <Link
              href={isParent ? "/dashboard/children" : "/dashboard/profile"}
              className="kc-btn-green shrink-0"
            >
              <UserPlus className="h-4 w-4" /> {isParent ? "Add a child" : "Set up my profile"}
            </Link>
          </div>
        </div>
      )}

      {/* Open competitions */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-kc-blue-950">
            Open registrations
          </h2>
          <Link href="/registrations" className="text-sm font-bold text-kc-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {openCompetitions.map((competition) => {
            const open = isRegistrationOpen(competition);
            return (
              <Link
                key={competition.id}
                href={`/competitions/${competition.slug}`}
                className="kc-card group flex items-center gap-4 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-kc-blue-50">
                  <Waves className="h-7 w-7 text-kc-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-bold uppercase tracking-wide text-kc-blue-950 group-hover:text-kc-blue-700">
                    {competition.name}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" /> {formatDate(competition.date)}
                  </p>
                </div>
                <span className={open ? "badge-green shrink-0" : "badge-blue shrink-0"}>
                  {open ? "Open" : "Closed"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent registrations */}
      {registrations.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-kc-blue-950">
              Recent registrations
            </h2>
            <Link href="/dashboard/registrations" className="text-sm font-bold text-kc-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="kc-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="kc-table min-w-[40rem]">
                <thead>
                  <tr>
                    <th>Swimmer</th>
                    <th>Competition</th>
                    <th>Events</th>
                    <th>Registered</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.slice(0, 5).map((reg) => (
                    <tr key={reg.id}>
                      <td>
                        <span className="font-semibold text-kc-blue-950">{reg.participant.fullName}</span>
                        <span className="block text-xs text-slate-400">
                          {reg.participant.ageGroup?.name ?? "—"}
                        </span>
                      </td>
                      <td className="font-semibold">{reg.competition.name}</td>
                      <td>
                        <div className="flex max-w-[12rem] flex-wrap gap-1">
                          {reg.events.map((ev) => (
                            <span key={ev.id} className="badge-blue">
                              {ev.competitionEvent.event.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-slate-500">{formatDate(reg.registeredAt)}</td>
                      <td>
                        <span className="badge-green">{reg.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}