import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Trophy, CalendarDays, User, Trash2 } from "lucide-react";
import { DeleteChildButton } from "@/components/committee/delete-child-button";

export const metadata = { title: "Child Profile" };

export default async function ChildProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const link = await prisma.parentChild.findUnique({
    where: {
      parentUserId_participantId: {
        parentUserId: session!.user!.id,
        participantId: id,
      },
    },
    include: {
      participant: {
        include: {
          ageGroup: true,
          registrations: {
            include: {
              competition: { select: { id: true, name: true, date: true, status: true, slug: true } },
              events: { include: { competitionEvent: { include: { event: true } } } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!link) notFound();

  const child = link.participant;

  // Get open competitions
  const openCompetitions = await prisma.competition.findMany({
    where: { status: "PUBLISHED", registrationOpensAt: { not: null } },
    orderBy: { date: "asc" },
  });

  return (
    <div>
      <Link href="/committee/my-children" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-kc-blue-600 hover:text-kc-blue-800">
        <ArrowLeft className="h-4 w-4" /> Back to My Children
      </Link>

      {/* Profile Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kc-blue-100 font-display text-2xl font-bold text-kc-blue-700">
              {child.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-kc-blue-950">
                {child.fullName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {child.gender === "MALE" ? "Male" : "Female"}</span>
                <span>DOB: {formatDate(child.dateOfBirth)}</span>
                <span>KC #{child.kcMembershipNumber}</span>
                {child.ageGroup && (
                  <span className="rounded-full bg-kc-green-50 px-2.5 py-0.5 text-xs font-bold text-kc-green-700">
                    {child.ageGroup.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <DeleteChildButton childId={child.id} childName={child.fullName} />
        </div>

        {/* Register for Competition */}
        {openCompetitions.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="font-display text-lg font-bold uppercase text-kc-blue-950">
              Register for Competition
            </h2>
            <p className="mt-1 text-sm text-slate-500">Select a competition to register {child.fullName}.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {openCompetitions.map((comp) => (
                <Link
                  key={comp.id}
                  href={`/competitions/${comp.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-kc-blue-200 bg-kc-blue-50 p-3 text-left transition-all hover:border-kc-blue-400 hover:bg-kc-blue-100"
                >
                  <Trophy className="h-5 w-5 shrink-0 text-kc-blue-600" />
                  <div>
                    <p className="text-sm font-bold text-kc-blue-950">{comp.name}</p>
                    <p className="text-xs text-slate-500">{formatDate(comp.date)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Registrations History */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="font-display text-lg font-bold uppercase text-kc-blue-950">
            Registration History
          </h2>
          {child.registrations.length === 0 ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <CalendarDays className="h-4 w-4" />
              No registrations yet.
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {child.registrations.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-bold text-kc-blue-950">{reg.competition.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(reg.competition.date)} · {reg.events.length} event{reg.events.length !== 1 ? "s" : ""} · {reg.status}
                    </p>
                  </div>
                  <Link
                    href={`/competitions/${reg.competition.slug}`}
                    className="text-xs font-semibold text-kc-blue-600 hover:text-kc-blue-800"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
