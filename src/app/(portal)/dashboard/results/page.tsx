import { prisma } from "@/lib/prisma";
import { requireParentOrParticipant } from "@/lib/auth-helpers";
import { formatDate, medalLabels } from "@/lib/utils";
import { Trophy, Medal } from "lucide-react";

const medalColors: Record<string, string> = {
  GOLD: "bg-kc-green-100 text-kc-green-700 ring-kc-green-300",
  SILVER: "bg-slate-100 text-slate-600 ring-slate-300",
  BRONZE: "bg-orange-100 text-orange-700 ring-orange-300",
};

export default async function ResultsHistoryPage() {
  const session = await requireParentOrParticipant();
  const userId = session.user.id;

  const registrations = await prisma.registration.findMany({
    where: {
      participant: {
        OR: [{ userId }, { parentLinks: { some: { parentUserId: userId } } }],
      },
    },
    include: {
      competition: { select: { name: true, date: true, status: true } },
      participant: { select: { fullName: true, ageGroup: true } },
      results: {
        include: {
          competitionEvent: { include: { event: true } },
          ageGroup: true,
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { registeredAt: "desc" },
  });

  const allResults = registrations
    .flatMap((r) => r.results.map((res) => ({ ...res, competition: r.competition, participantName: r.participant.fullName })))
    .sort((a, b) => (b.competition.date > a.competition.date ? 1 : -1));

  const medalCounts = {
    GOLD: allResults.filter((r) => r.medal === "GOLD").length,
    SILVER: allResults.filter((r) => r.medal === "SILVER").length,
    BRONZE: allResults.filter((r) => r.medal === "BRONZE").length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          Results &amp; History
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your competition history and result records, kept permanently.
        </p>
      </div>

      {/* Medal summary */}
      {(medalCounts.GOLD > 0 || medalCounts.SILVER > 0 || medalCounts.BRONZE > 0) && (
        <div className="grid grid-cols-3 gap-4">
          <div className="kc-card flex items-center gap-3 p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-full ${medalColors.GOLD}`}>
              <Medal className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-3xl font-extrabold text-kc-blue-950">{medalCounts.GOLD}</p>
              <p className="text-xs font-semibold text-slate-500">Gold</p>
            </div>
          </div>
          <div className="kc-card flex items-center gap-3 p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-full ${medalColors.SILVER}`}>
              <Medal className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-3xl font-extrabold text-kc-blue-950">{medalCounts.SILVER}</p>
              <p className="text-xs font-semibold text-slate-500">Silver</p>
            </div>
          </div>
          <div className="kc-card flex items-center gap-3 p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-full ${medalColors.BRONZE}`}>
              <Medal className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-3xl font-extrabold text-kc-blue-950">{medalCounts.BRONZE}</p>
              <p className="text-xs font-semibold text-slate-500">Bronze</p>
            </div>
          </div>
        </div>
      )}

      {/* Results list */}
      {allResults.length === 0 ? (
        <div className="kc-card flex flex-col items-center p-12 text-center text-slate-500">
          <Trophy className="mb-3 h-12 w-12 text-kc-green-300" />
          <p className="font-semibold text-slate-600">No results recorded yet.</p>
          <p className="mt-1 text-sm">
            Once the committee publishes results, they will appear here and stay in your history.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {allResults.map((result) => (
            <div key={result.id} className="kc-card flex flex-wrap items-center gap-4 p-5">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  result.medal !== "NONE"
                    ? medalColors[result.medal]
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <strong className="font-display text-lg">
                  {result.position ?? "—"}
                </strong>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold uppercase tracking-wide text-kc-blue-950">
                  {result.competitionEvent.event.name}
                </p>
                <p className="text-sm text-slate-500">
                  {result.competition.name} · {formatDate(result.competition.date)}
                  {result.ageGroup && ` · ${result.ageGroup.name}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold tabular-nums text-kc-blue-950">
                  {result.time ?? "—"}
                </p>
                {result.medal !== "NONE" && (
                  <span className={`badge mt-1 ${medalColors[result.medal]}`}>
                    {medalLabels[result.medal]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History timeline */}
      {registrations.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-wide text-kc-blue-950">
            Competition history
          </h2>
          <div className="flex flex-col gap-3">
            {registrations.map((reg) => (
              <div key={reg.id} className="kc-card flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-kc-blue-950">{reg.competition.name}</p>
                  <p className="text-xs text-slate-500">
                    {reg.participant.fullName} · {formatDate(reg.competition.date)}
                  </p>
                </div>
                <span className={`badge ${reg.competition.status === "ARCHIVED" ? "badge-slate" : "badge-blue"}`}>
                  {reg.competition.status === "ARCHIVED" ? "Completed" : "Upcoming"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}