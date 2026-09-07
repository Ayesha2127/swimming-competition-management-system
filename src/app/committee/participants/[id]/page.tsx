import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCommittee } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Participant · Committee" };

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  REGISTERED: "badge-blue",
  CONFIRMED: "badge-green",
  PENDING: "badge-mint",
  CANCELLED: "badge-slate",
};

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCommittee();
  const { id } = await params;

  const participant = await prisma.participant.findUnique({
    where: { id },
    include: {
      ageGroup: true,
      user: { select: { name: true, email: true } },
      parentLinks: {
        include: { parent: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      registrations: {
        include: {
          competition: { select: { id: true, name: true, slug: true } },
          ageGroup: true,
          events: {
            include: { competitionEvent: { include: { event: true } }, relayTeam: true },
          },
        },
        orderBy: { registeredAt: "desc" },
      },
      results: {
        include: {
          competition: { select: { name: true, slug: true } },
          competitionEvent: { include: { event: true } },
          ageGroup: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!participant) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/committee/participants"
        className="inline-flex items-center gap-1 text-sm font-bold text-kc-blue-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> All participants
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
            {participant.fullName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            KC #{participant.kcMembershipNumber}
            {participant.user ? ` · linked account ${participant.user.email ?? ""}` : ""}
          </p>
        </div>
        <span className={cn("badge", participant.isActive ? "badge-green" : "badge-slate")}>
          {participant.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="kc-card p-5 lg:col-span-1">
          <h2 className="kc-section-title">Profile</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Date of birth</dt>
              <dd className="font-semibold text-kc-blue-950">{formatDate(participant.dateOfBirth)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Gender</dt>
              <dd className="font-semibold text-kc-blue-950">
                {participant.gender === "MALE" ? "Male" : "Female"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Age group</dt>
              <dd>
                {participant.ageGroup ? (
                  <span className="badge badge-blue">{participant.ageGroup.name}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Phone</dt>
              <dd className="font-semibold text-kc-blue-950">{participant.phone}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Email</dt>
              <dd className="truncate font-semibold text-kc-blue-950">{participant.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Created</dt>
              <dd className="font-semibold text-kc-blue-950">{formatDate(participant.createdAt)}</dd>
            </div>
          </dl>

          <h3 className="kc-section-title mt-6">Linked parents</h3>
          {participant.parentLinks.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No linked parent accounts.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {participant.parentLinks.map((link) => (
                <li key={link.id} className="rounded-lg bg-kc-blue-50 px-3 py-2">
                  <p className="font-semibold text-kc-blue-950">{link.parent.name ?? "Parent account"}</p>
                  <p className="text-xs text-slate-500">{link.parent.email}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="lg:col-span-2 space-y-6">
          <section className="kc-card overflow-hidden">
            <h2 className="kc-section-title border-b border-slate-100 px-5 py-4">
              Registrations ({participant.registrations.length})
            </h2>
            {participant.registrations.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">No registrations yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {participant.registrations.map((reg) => (
                  <div key={reg.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link
                        href={`/competitions/${reg.competition.slug}`}
                        className="text-sm font-bold text-kc-blue-950 hover:text-kc-blue-600 hover:underline"
                      >
                        {reg.competition.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {reg.ageGroup?.name ?? "—"} · registered {formatDate(reg.registeredAt)}
                      </p>
                      {reg.events.length > 0 && (
                        <p className="mt-1 max-w-md flex-wrap text-xs text-slate-500">
                          {reg.events.map((ev) => ev.competitionEvent.event.name).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className={cn("badge shrink-0", STATUS_BADGE[reg.status] ?? "badge-slate")}>
                      {reg.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="kc-card overflow-hidden">
            <h2 className="kc-section-title border-b border-slate-100 px-5 py-4">
              Results ({participant.results.length})
            </h2>
            {participant.results.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">No results recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="kc-table min-w-[36rem]">
                  <thead>
                    <tr>
                      <th>Competition</th>
                      <th>Event</th>
                      <th>Time</th>
                      <th>Place</th>
                      <th>Medal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participant.results.map((r) => (
                      <tr key={r.id}>
                        <td className="text-slate-500">{r.competition.name}</td>
                        <td className="font-medium text-kc-blue-950">
                          {r.competitionEvent.event.name}
                          {r.ageGroup ? ` (${r.ageGroup.name})` : ""}
                        </td>
                        <td className="text-slate-500">{r.time ?? "—"}</td>
                        <td className="text-slate-500">{r.position ?? "—"}</td>
                        <td>
                          {r.medal !== "NONE" ? (
                            <span className={cn("badge", r.medal === "GOLD" ? "badge-mint" : r.medal === "SILVER" ? "badge-slate" : "badge-bronze")}>
                              {r.medal}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}