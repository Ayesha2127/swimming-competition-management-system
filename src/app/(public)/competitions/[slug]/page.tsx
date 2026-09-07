import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  isRegistrationOpen,
  cn,
  formatDateTime,
  formatDate,
} from "@/lib/utils";
import { UserRole } from "@prisma/client";
import {
  CalendarDays,
  MapPin,
  Clock,
  Trophy,
  ClipboardCheck,
  Lock,
  ArrowLeft,
  ScrollText,
  Waves,
} from "lucide-react";
import { RegistrationForm } from "@/components/registration-form";

export const metadata = { title: "Competition" };

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      rules: { orderBy: { sortOrder: "asc" } },
      events: {
        where: { isEnabled: true },
        orderBy: { sortOrder: "asc" },
        include: {
          event: { include: { stroke: true } },
          ageGroups: true,
        },
      },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!competition || competition.status === "DRAFT") {
    notFound();
  }

  const open = isRegistrationOpen(competition);

  // Resolve the visitor's participants (self or parent-managed children)
  let participants: {
    id: string;
    fullName: string;
    ageGroupId: string | null;
    ageGroupName: string | null;
    createdAt: string;
  }[] = [];
  let registeredParticipantIds: string[] = [];

  if (session?.user?.id) {
    const userId = session.user.id;
    if (session.user.role === UserRole.COMMITTEE) {
      // Committee normally uses the dashboard, but allow them to view too
      participants = [];
    } else {
      const own = await prisma.participant.findUnique({
        where: { userId },
        include: { ageGroup: true },
      });
      const childrenRows = await prisma.parentChild.findMany({
        where: { parentUserId: userId },
        include: { participant: { include: { ageGroup: true } } },
      });

      participants = [
        ...(own ? [own] : []),
        ...childrenRows.map((row) => row.participant),
      ].map((p) => ({
        id: p.id,
        fullName: p.fullName,
        ageGroupId: p.ageGroupId,
        ageGroupName: p.ageGroup?.name ?? null,
        createdAt: p.createdAt.toISOString(),
      }));

      if (participants.length > 0) {
        const regs = await prisma.registration.findMany({
          where: { competitionId: competition.id, participantId: { in: participants.map((p) => p.id) } },
          include: { participant: true, ageGroup: true, events: { include: { competitionEvent: { include: { event: true } } } } },
        });
        registeredParticipantIds = regs.map((r) => r.participantId);
      }
    }
  }

  // Available registration form data
  const ageGroups = await prisma.ageGroup.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const registrationData = {
    competitionId: competition.id,
    competitionName: competition.name,
    maxEventsPerParticipant: competition.maxEventsPerParticipant,
    participants: participants.filter((p) => !registeredParticipantIds.includes(p.id)),
    events: competition.events.map((ce) => ({
      id: ce.id,
      event: {
        id: ce.event.id,
        name: ce.event.name,
        distance: ce.event.distance,
        isRelay: ce.event.isRelay,
        relaySwimmers: ce.event.relaySwimmers,
        stroke: ce.event.stroke,
      },
      ageGroupIds: ce.ageGroups.map((ag) => ag.ageGroupId),
    })),
    ageGroups: ageGroups.map((ag) => ({ id: ag.id, name: ag.name })),
    registeredParticipantIds,
  };

  // Public results for this competition (individuals + relays)
  const results = await prisma.result.findMany({
    where: { competitionId: competition.id },
    include: {
      competitionEvent: { include: { event: true } },
      ageGroup: true,
      participant: { include: { ageGroup: true } },
      relayTeam: { include: { members: { include: { participant: true } } } },
    },
    orderBy: [{ competitionEvent: { sortOrder: "asc" } }, { position: "asc" }],
  });

  const resultsByEvent = results.reduce<Map<string, { name: string; rows: typeof results }>>(
    (acc, r) => {
      const key = r.competitionEventId;
      if (!acc.has(key)) {
        acc.set(key, {
          name: r.competitionEvent.event.isRelay
            ? `${r.competitionEvent.event.name} (Relay)`
            : r.competitionEvent.event.name,
          rows: [],
        });
      }
      acc.get(key)!.rows.push(r);
      return acc;
    },
    new Map(),
  );

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="kc-bg-hero-gradient py-14 pt-28 text-white md:py-20 md:pt-32">
        <div className="kc-container">
          <Link href="/registrations" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-kc-blue-200 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> All registrations
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn(open ? "badge-green" : "badge-blue")}>
              {open ? "● Registration open" : competition.status === "ARCHIVED" ? "Completed" : "Registrations closed"}
            </span>
            {open && competition.registrationClosesAt && (
              <span className="badge-mint">
                <Clock className="mr-1 h-3 w-3" />
                Closes {formatDateTime(competition.registrationClosesAt)}
              </span>
            )}
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold uppercase tracking-tight md:text-6xl">
            {competition.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-kc-blue-100">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-kc-green-300" /> {formatDate(competition.date)}
            </span>
            {competition.venue && (
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-kc-green-300" /> {competition.venue}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-kc-green-300" />
              {competition.maxEventsPerParticipant
                ? `Max ${competition.maxEventsPerParticipant} events per participant`
                : "No event limit"}
            </span>
          </div>
        </div>
      </section>

      {/* Warning banner for authenticated but already-registered participant */}
      {session?.user?.id && session.user.role !== UserRole.COMMITTEE && registeredParticipantIds.length > 0 && !open && (
        <div className="kc-container mt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-kc-blue-200 bg-kc-blue-50 p-4 text-sm text-kc-blue-800">
            <ClipboardCheck className="h-5 w-5 shrink-0" />
            <span>
              You (or a child on your account) are already registered for this competition.{" "}
              <Link href="/dashboard" className="font-bold underline">
                View registrations in your dashboard
              </Link>
              .
            </span>
          </div>
        </div>
      )}

      <section className="kc-container py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Left: details + rules + events */}
          <div className="lg:col-span-3">
            {competition.description && (
              <div className="kc-card p-6">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wide text-kc-blue-950">
                  <Waves className="h-5 w-5 text-kc-blue-600" /> About this competition
                </h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">
                  {competition.description}
                </p>
              </div>
            )}

            {competition.rules.length > 0 && (
              <div className="mt-6 kc-card p-6">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wide text-kc-blue-950">
                  <ScrollText className="h-5 w-5 text-kc-green-500" /> Rules &amp; Instructions
                </h2>
                <div className="mt-4 space-y-5">
                  {competition.rules.map((rule) => (
                    <div key={rule.id}>
                      {rule.title && (
                        <h3 className="text-sm font-bold uppercase tracking-wide text-kc-blue-700">
                          {rule.title}
                        </h3>
                      )}
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                        {rule.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available events */}
            <div className="mt-6 kc-card p-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wide text-kc-blue-950">
                <Trophy className="h-5 w-5 text-kc-green-500" /> Events
              </h2>

              {competition.events.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">Events for this competition will be announced soon.</p>
              )}

              {competition.events.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {competition.events.map((ce, i) => (
                    <div key={ce.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kc-blue-600 font-display text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-kc-blue-950">{ce.event.name}</p>
                        <p className="text-xs text-slate-500">
                          {ce.event.isRelay
                            ? `Relay · ${ce.event.relaySwimmers ?? 4} swimmers`
                            : ce.event.stroke?.name ?? "Individual"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="mt-6 kc-card overflow-hidden">
                <div className="px-6 pt-6">
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wide text-kc-blue-950">
                    <Trophy className="h-5 w-5 text-kc-green-500" /> Results
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Official results for {competition.name}.
                  </p>
                </div>
                <div className="mt-4 space-y-6 px-6 pb-6">
                  {Array.from(resultsByEvent.entries()).map(([ceId, group]) => (
                    <div key={ceId} className="overflow-hidden rounded-2xl border border-slate-100">
                      <div className="bg-slate-50 px-4 py-2.5">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-kc-blue-800">
                          {group.name}
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-white text-xs uppercase tracking-wide text-slate-400">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold">Place</th>
                              <th className="px-4 py-2 text-left font-semibold">Swimmer</th>
                              <th className="px-4 py-2 text-left font-semibold">Age group</th>
                              <th className="px-4 py-2 text-left font-semibold">Time</th>
                              <th className="px-4 py-2 text-left font-semibold">Medal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.rows.map((r) => (
                              <tr key={r.id} className="bg-white">
                                <td className="px-4 py-2.5 font-display text-base font-bold text-kc-blue-950">
                                  {r.position ?? "—"}
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-kc-blue-950">
                                  {r.relayTeam
                                    ? r.relayTeam.members
                                        .map((m) => m.participant?.fullName ?? "—")
                                        .join(", ")
                                    : r.participant?.fullName ?? "—"}
                                </td>
                                <td className="px-4 py-2.5 text-slate-500">
                                  {r.ageGroup?.name ?? (r.participant?.ageGroup?.name ?? "—")}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-slate-600">{r.time ?? "—"}</td>
                                <td className="px-4 py-2.5">
                                  {r.medal !== "NONE" ? (
                                    <span
                                      className={cn(
                                        "badge",
                                        r.medal === "GOLD"
                                          ? "badge-mint"
                                          : r.medal === "SILVER"
                                            ? "badge-slate"
                                            : "badge-bronze",
                                      )}
                                    >
                                      {r.medal.charAt(0) + r.medal.slice(1).toLowerCase()}
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: registration form / auth CTA */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {!session?.user?.id && (
                <div className="rounded-2xl border border-kc-blue-200 bg-kc-blue-50 p-8 text-center">
                  <Lock className="mx-auto mb-3 h-10 w-10 text-kc-blue-600" />
                  <h2 className="font-display text-xl font-bold uppercase text-kc-blue-950">
                    Login to register
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Create a profile or log in to register {competition.name}. Your permanent profile
                    makes every future registration one click easier.
                  </p>
                  <div className="mt-5 flex flex-col gap-2">
                    <Link href={`/login?callbackUrl=${encodeURIComponent(`/competitions/${slug}`)}`} className="kc-btn-primary !w-full">
                      Login
                    </Link>
                    <Link href={`/signup?callbackUrl=${encodeURIComponent(`/competitions/${slug}`)}`} className="kc-btn-outline !w-full">
                      Create an account
                    </Link>
                  </div>
                </div>
              )}

              {session?.user?.id && session.user.role === UserRole.COMMITTEE && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                  <p className="text-sm text-slate-600">
                    You are signed in as a committee member.{" "}
                    <Link href="/committee" className="font-bold text-kc-blue-600 underline">
                      Go to the committee dashboard
                    </Link>{" "}
                    to manage this competition.
                  </p>
                </div>
              )}

              {session?.user?.id && session.user.role !== UserRole.COMMITTEE && open && (
                <div className="space-y-4">
                  {registeredParticipantIds.length > 0 && (
                    <div className="rounded-2xl border border-kc-green-200 bg-kc-green-50 p-6">
                      <ClipboardCheck className="mb-2 h-9 w-9 text-kc-green-600" />
                      <h2 className="font-display text-lg font-bold uppercase text-kc-green-700">
                        {registeredParticipantIds.length === 1
                          ? "You are already registered for this competition."
                          : "Some swimmers on your account are already registered."}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Duplicate registrations are not allowed. Already-registered swimmers can still
                        view their registration details in the dashboard.
                      </p>
                      <Link href="/dashboard" className="kc-btn-green mt-4">
                        View my registration
                      </Link>
                    </div>
                  )}

                  {registrationData.participants.length > 0 || registeredParticipantIds.length === 0 ? (
                    <RegistrationForm data={registrationData} />
                  ) : null}
                </div>
              )}

              {session?.user?.id && session.user.role !== UserRole.COMMITTEE && !open && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                  <ClipboardCheck className="mx-auto mb-2 h-9 w-9 text-slate-400" />
                  <h2 className="font-display text-xl font-bold uppercase text-slate-600">
                    Registration is closed
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    This competition is {competition.status === "ARCHIVED" ? "completed" : "not currently accepting registrations"}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}