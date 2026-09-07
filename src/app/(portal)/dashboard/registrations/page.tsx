import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireParentOrParticipant } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/utils";
import { ClipboardList, CalendarDays } from "lucide-react";

export default async function DashboardRegistrationsPage() {
  const session = await requireParentOrParticipant();
  const userId = session.user.id;

  const registrations = await prisma.registration.findMany({
    where: {
      participant: {
        OR: [{ userId }, { parentLinks: { some: { parentUserId: userId } } }],
      },
    },
    include: {
      competition: { select: { name: true, slug: true, date: true, status: true } },
      participant: { select: { fullName: true, ageGroup: true } },
      events: {
        include: {
          competitionEvent: { include: { event: true } },
          relayTeam: { include: { members: true } },
        },
      },
      ageGroup: true,
    },
    orderBy: { registeredAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          My Registrations
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Every competition you are registered for, along with selected events.
        </p>
      </div>

      {registrations.length === 0 && (
        <div className="kc-card flex flex-col items-center p-12 text-center">
          <ClipboardList className="mb-3 h-12 w-12 text-kc-blue-300" />
          <h2 className="font-display text-xl font-bold uppercase text-kc-blue-950">No registrations yet</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            When you register for a competition, all of your entries will appear here.
          </p>
          <Link href="/registrations" className="kc-btn-primary mt-5">
            Browse open competitions
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {registrations.map((reg) => (
          <div key={reg.id} className="kc-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-kc-blue-950">
                  {reg.competition.name}
                </h2>
                <p className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                  <span>{reg.participant.fullName} · {reg.ageGroup?.name ?? "—"}</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {formatDate(reg.competition.date)}
                  </span>
                </p>
              </div>
              <span className="badge-green">{reg.status.toUpperCase()}</span>
            </div>

            <div className="px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Entered events</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {reg.events.map((ev) => (
                  <div key={ev.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-bold text-kc-blue-950">{ev.competitionEvent.event.name}</p>
                    <p className="text-xs text-slate-500">
                      {ev.competitionEvent.event.isRelay ? "Relay" : "Individual"}
                    </p>
                    {ev.relayTeam && (
                      <div className="mt-2 rounded-lg bg-kc-blue-50 p-2.5">
                        <p className="text-[0.65rem] font-bold uppercase tracking-wide text-kc-blue-700">
                          Relay team
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {ev.relayTeam.members.map((m, i) => (
                            <li key={m.id} className="text-xs text-slate-600">
                              {i + 1}. {m.fullName}
                              {m.kcMembershipNumber ? ` (${m.kcMembershipNumber})` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Registered on {formatDate(reg.registeredAt)} · Registration ID {reg.id.slice(0, 8)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}