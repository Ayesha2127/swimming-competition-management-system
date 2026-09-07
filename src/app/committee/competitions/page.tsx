import { prisma } from "@/lib/prisma";
import { requireCommittee } from "@/lib/auth-helpers";
import { CompetitionsList } from "@/components/committee/competitions-list";

export const metadata = { title: "Competitions · Committee" };

export default async function CompetitionsPage() {
  await requireCommittee();
  const competitions = await prisma.competition.findMany({
    include: { _count: { select: { registrations: true, events: true, results: true } } },
    orderBy: [{ status: "asc" }, { date: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          Competitions
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create competitions, attach events and rules, manage galleries, review registrations and
          results — all without code.
        </p>
      </div>
      <CompetitionsList
        initial={competitions.map((c) => ({
          ...c,
          date: c.date.toISOString(),
          registrationOpensAt: c.registrationOpensAt?.toISOString() ?? null,
          registrationClosesAt: c.registrationClosesAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}