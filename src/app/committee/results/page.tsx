import { prisma } from "@/lib/prisma";
import { requireCommittee } from "@/lib/auth-helpers";
import { cn } from "@/lib/utils";

export const metadata = { title: "Results · Committee" };

export const dynamic = "force-dynamic";

const MEDAL_BADGE: Record<string, string> = {
  GOLD: "badge-mint",
  SILVER: "badge-slate",
  BRONZE: "badge-bronze",
  NONE: "badge-slate",
};

export default async function CommitteeResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string }>;
}) {
  await requireCommittee();
  const sp = await searchParams;
  const competitionFilter = sp.competition ?? "ALL";

  const competitions = await prisma.competition.findMany({
    select: { id: true, name: true },
    orderBy: { date: "desc" },
  });

  const results = await prisma.result.findMany({
    where: competitionFilter !== "ALL" ? { competitionId: competitionFilter } : {},
    include: {
      competition: { select: { id: true, name: true } },
      competitionEvent: { include: { event: true } },
      ageGroup: true,
      registration: { include: { participant: true } },
      relayTeam: { include: { members: true } },
    },
    orderBy: [{ competition: { date: "desc" } }, { competitionEvent: { sortOrder: "asc" } }],
    take: 500,
  });

  const displayName = (r: (typeof results)[number]) =>
    r.relayTeam
      ? `${r.relayTeam.name} (${r.relayTeam.members.map((m) => m.fullName).join(", ")})`
      : r.registration?.participant.fullName ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          Results
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          All recorded results across competitions (latest 500). Add or edit results from each
          competition&apos;s manage page.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-3">
        <select name="competition" defaultValue={competitionFilter} className="kc-input w-auto max-w-[20rem]">
          <option value="ALL">All competitions</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="kc-btn-primary">Filter</button>
      </form>

      <div className="kc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="kc-table min-w-[52rem]">
            <thead>
              <tr>
                <th>Competition</th>
                <th>Event</th>
                <th>Swimmer / Team</th>
                <th>Age group</th>
                <th className="text-center">Pos</th>
                <th>Time</th>
                <th>Medal</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No results yet. Add them from a competition&apos;s Results tab.
                  </td>
                </tr>
              )}
              {results.map((r) => (
                <tr key={r.id}>
                  <td className="max-w-[14rem] truncate text-kc-blue-900">{r.competition.name}</td>
                  <td className="font-medium text-kc-blue-950">{r.competitionEvent.event.name}</td>
                  <td className="text-slate-600">{displayName(r)}</td>
                  <td>{r.ageGroup ? <span className="badge badge-blue">{r.ageGroup.name}</span> : <span className="text-slate-400">—</span>}</td>
                  <td className="text-center font-semibold text-kc-blue-950">{r.position ?? "—"}</td>
                  <td className="text-slate-500">{r.time ?? "—"}</td>
                  <td>
                    <span className={cn("badge", MEDAL_BADGE[r.medal] ?? "badge-slate")}>
                      {r.medal === "NONE" ? "—" : r.medal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}