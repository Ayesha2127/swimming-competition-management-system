import { prisma } from "@/lib/prisma";
import { requireCommittee } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { RegistrationStatus } from "@prisma/client";

export const metadata = { title: "Registrations · Committee" };

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  REGISTERED: "badge-blue",
  CONFIRMED: "badge-green",
  PENDING: "badge-mint",
  CANCELLED: "badge-slate",
};

export default async function CommitteeRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    competition?: string;
    q?: string;
    event?: string;
    stroke?: string;
    gender?: string;
    page?: string;
  }>;
}) {
  await requireCommittee();
  const sp = await searchParams;
  const statusFilter = sp.status ?? "ALL";
  const competitionFilter = sp.competition ?? "ALL";
  const eventFilter = sp.event ?? "ALL";
  const strokeFilter = sp.stroke ?? "ALL";
  const genderFilter = sp.gender ?? "ALL";
  const q = (sp.q ?? "").trim();

  const PAGE_SIZE = 25;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const [competitions, strokes, events] = await Promise.all([
    prisma.competition.findMany({
      select: { id: true, name: true },
      orderBy: { date: "desc" },
    }),
    prisma.stroke.findMany({
      where: { isActive: true },
      include: { events: true },
      orderBy: { name: "asc" },
    }),
    prisma.competitionEvent.findMany({
      include: { event: true },
      orderBy: { event: { distance: "asc" } },
    }),
  ]);

  const baseWhere = {
    ...(competitionFilter !== "ALL" ? { competitionId: competitionFilter } : {}),
    ...(eventFilter !== "ALL" ? { events: { some: { competitionEventId: eventFilter } } } : {}),
    ...(strokeFilter !== "ALL"
      ? { events: { some: { competitionEvent: { event: { strokeId: strokeFilter } } } } }
      : {}),
    ...(genderFilter !== "ALL" ? { participant: { gender: genderFilter as "MALE" | "FEMALE" } } : {}),
    ...(q
      ? {
          participant: {
            OR: [
              { fullName: { contains: q, mode: "insensitive" as const } },
              { kcMembershipNumber: { contains: q } },
            ],
          },
        }
      : {}),
  };

  const where = {
    ...baseWhere,
    ...(statusFilter !== "ALL" ? { status: statusFilter as RegistrationStatus } : {}),
  };

  const [registrations, total, counts] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: {
        participant: true,
        ageGroup: true,
        competition: { select: { id: true, name: true, slug: true } },
        events: {
          include: {
            competitionEvent: { include: { event: true } },
            relayTeam: { include: { members: true } },
          },
        },
      },
      orderBy: { registeredAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.registration.count({ where }),
    prisma.registration.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const countMap: Record<string, number> = { ALL: counts.reduce((n, c) => n + c._count._all, 0) };
  for (const c of counts) countMap[c.status] = c._count._all;

  const statuses = ["ALL", "REGISTERED", "CONFIRMED", "PENDING", "CANCELLED"];

  const filterLink = (params: Record<string, string>) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (competitionFilter !== "ALL") next.set("competition", competitionFilter);
    if (eventFilter !== "ALL") next.set("event", eventFilter);
    if (strokeFilter !== "ALL") next.set("stroke", strokeFilter);
    if (genderFilter !== "ALL") next.set("gender", genderFilter);
    if (statusFilter !== "ALL") next.set("status", statusFilter);
    for (const [k, v] of Object.entries(params)) next.set(k, v);
    return `/committee/registrations?${next.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          Registrations
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {total} registration{total === 1 ? "" : "s"} across competitions. Manage individual
          competition registrations from the competition&apos;s manage page.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-3">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search swimmer or KC number"
          className="kc-input max-w-xs"
          aria-label="Search"
        />
        <select name="competition" defaultValue={competitionFilter} className="kc-input w-auto max-w-[16rem]">
          <option value="ALL">All competitions</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={statusFilter} className="kc-input w-auto">
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All statuses" : s} · {countMap[s] ?? 0}
            </option>
          ))}
        </select>
        <select name="event" defaultValue={eventFilter} className="kc-input w-auto max-w-[16rem]">
          <option value="ALL">All events</option>
          {events
            .filter((ev) => competitionFilter === "ALL" || ev.competitionId === competitionFilter)
            .map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.event.name} · {ev.event.distance}m
              </option>
            ))}
        </select>
        <select name="stroke" defaultValue={strokeFilter} className="kc-input w-auto">
          <option value="ALL">All strokes</option>
          {strokes.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select name="gender" defaultValue={genderFilter} className="kc-input w-auto">
          <option value="ALL">All genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        <button type="submit" className="kc-btn-primary">Filter</button>
      </form>

      <div className="kc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="kc-table min-w-[60rem]">
            <thead>
              <tr>
                <th>Competition</th>
                <th>Swimmer</th>
                <th>KC #</th>
                <th>Age group</th>
                <th>Events</th>
                <th>Registered</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No registrations match your filters.
                  </td>
                </tr>
              )}
              {registrations.map((reg) => (
                <tr key={reg.id}>
                  <td className="max-w-[14rem] truncate font-medium text-kc-blue-900">{reg.competition.name}</td>
                  <td className="font-semibold text-kc-blue-950">{reg.participant.fullName}</td>
                  <td className="text-slate-500">{reg.participant.kcMembershipNumber}</td>
                  <td>{reg.ageGroup ? <span className="badge badge-blue">{reg.ageGroup.name}</span> : <span className="text-slate-400">—</span>}</td>
                  <td>
                    <div className="max-w-[16rem] space-y-0.5">
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
                    <span className={cn("badge", STATUS_BADGE[reg.status] ?? "badge-slate")}>{reg.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} · {total} results
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <a href={filterLink({ page: String(page - 1) })} className="kc-btn-outline !px-3 !py-1.5 text-sm">
                Previous
              </a>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <a
                key={n}
                href={filterLink({ page: String(n) })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm",
                  n === page
                    ? "border-kc-blue-600 bg-kc-blue-600 text-white"
                    : "border-slate-200 hover:border-kc-blue-600 hover:text-kc-blue-600",
                )}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </a>
            ))}
            {page < totalPages && (
              <a href={filterLink({ page: String(page + 1) })} className="kc-btn-outline !px-3 !py-1.5 text-sm">
                Next
              </a>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}