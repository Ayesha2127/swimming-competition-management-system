import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cn, isRegistrationOpen, formatDateTime } from "@/lib/utils";
import { CalendarDays, MapPin, ArrowRight, ClipboardCheck, Users } from "lucide-react";

export const metadata = {
  title: "Registrations",
  description:
    "Open and upcoming swimming competition registrations at Karachi Club. Register your swimmer in minutes.",
};

export default async function RegistrationsPage() {
  const session = await auth();
  const [competitions, registrations] = await Promise.all([
    prisma.competition.findMany({
      where: { status: { in: ["PUBLISHED"] } },
      include: {
        events: { where: { isEnabled: true }, include: { event: true } },
      },
      orderBy: { date: "asc" },
    }),
    // Fetch the visitor's own registrations so we can mark "already registered".
    // Includes the swimmer's own profile AND any children linked to a parent account.
    session?.user?.id
      ? prisma.registration.findMany({
          where: {
            participant: {
              OR: [
                { userId: session.user.id },
                { parentLinks: { some: { parentUserId: session.user.id } } },
              ],
            },
            competition: { status: { in: ["PUBLISHED"] } },
          },
          select: { competitionId: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  const myRegistrationMap = new Map(registrations.map((r) => [r.competitionId, r.status]));

  return (
    <div className="flex-1">
      {/* Page hero */}
      <section className="kc-bg-hero-gradient py-16 pt-28 text-white md:py-24 md:pt-32">
        <div className="kc-container">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-kc-green-300">Registrations</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight md:text-6xl">
            Open Competitions
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-kc-blue-100/90">
            Register once with your permanent profile and enter any KC swimming competition.
            Your committee dashboard receives your registration automatically.
          </p>
        </div>
      </section>

      <section className="kc-container py-14 md:py-20">
        {competitions.length === 0 && (
          <div className="kc-card p-12 text-center">
            <h2 className="font-display text-2xl font-bold uppercase text-kc-blue-950">
              No open registrations right now
            </h2>
            <p className="mx-auto mt-2 max-w-md text-slate-500">
              Check back soon. The KC Swimming committee regularly opens new competitions for all
              age groups.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {competitions.map((competition) => {
            const open = isRegistrationOpen(competition);
            const alreadyRegistered = myRegistrationMap.has(competition.id);
            return (
              <div
                key={competition.id}
                className="kc-card flex flex-col overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="bg-kc-blue-950 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <span className={cn(open ? "badge-green" : "badge-blue")}>
                      {open ? "● Registration open" : "Published"}
                    </span>
                    {alreadyRegistered && <span className="badge-green">✓ Registered</span>}
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide">
                    {competition.name}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-kc-blue-100/90">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-kc-green-300" />
                      {formatDateTime(competition.date)}
                    </span>
                    {competition.venue && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-kc-green-300" />
                        {competition.venue}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">
                    {competition.description}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Events</p>
                      <p className="mt-1 font-bold text-kc-blue-950">
                        {competition.events.length} available
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Max events</p>
                      <p className="mt-1 font-bold text-kc-blue-950">
                        {competition.maxEventsPerParticipant ?? "No limit"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-kc-green-200 bg-kc-green-50 p-3 text-xs text-kc-green-800">
                    <span className="font-bold">Deadline:</span>{" "}
                    {competition.registrationClosesAt
                      ? formatDateTime(competition.registrationClosesAt)
                      : "To be announced"}
                  </div>

                  <div className="mt-auto pt-6">
                    {alreadyRegistered ? (
                      <Link
                        href="/dashboard"
                        className="kc-btn-outline !w-full"
                      >
                        <ClipboardCheck className="h-4 w-4" /> View my registration
                      </Link>
                    ) : (
                      <Link
                        href={`/competitions/${competition.slug}`}
                        className={cn(open ? "kc-btn-primary" : "kc-btn-outline", "!w-full")}
                      >
                        {open ? "Register now" : "View details"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!session && (
          <div className="mt-12 rounded-2xl bg-kc-blue-50 p-6 text-center md:p-8">
            <Users className="mx-auto mb-3 h-10 w-10 text-kc-blue-600" />
            <h3 className="font-display text-2xl font-bold uppercase text-kc-blue-950">
              Have an account? Sign in to register faster.
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
              Your permanent profile saves you from re-entering your details. New here? Create a
              profile in under two minutes.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/login" className="kc-btn-primary">
                Login
              </Link>
              <Link href="/signup" className="kc-btn-outline">
                Create an account
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
