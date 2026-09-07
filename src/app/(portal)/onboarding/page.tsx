import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireParentOrParticipant } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { CheckCircle2, ArrowRight, UserPlus, Waves } from "lucide-react";
import { ParticipantForm } from "@/components/profile/participant-form";

export default async function OnboardingPage() {
  const session = await requireParentOrParticipant();
  const isParent = session.user.role === UserRole.PARENT;

  const ageGroups = await prisma.ageGroup.findMany({ orderBy: { sortOrder: "asc" } });

  const [own, children] = await Promise.all([
    prisma.participant.findUnique({
      where: { userId: session.user.id },
      include: { ageGroup: true },
    }),
    prisma.parentChild.findMany({
      where: { parentUserId: session.user.id },
      include: { participant: { include: { ageGroup: true } } },
    }),
  ]);

  const hasSwimmers = isParent ? children.length > 0 : Boolean(own);
  const swimmers = isParent ? children.map((c) => c.participant) : own ? [own] : [];

  return (
    <div className="min-h-screen bg-kc-blue-50/50 py-12">
      <div className="kc-container max-w-3xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm md:p-12">
          {/* Step indicator */}
          <div className="mb-8 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-kc-blue-600 text-sm font-bold text-white">
              1
            </span>
            <span className="h-px flex-1 bg-kc-blue-200" />
            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${hasSwimmers ? "bg-kc-blue-600 text-white" : "bg-slate-200 text-slate-400"}`}>
              2
            </span>
            <span className="h-px flex-1 bg-slate-200" />
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-400">
              3
            </span>
          </div>

          <div className="flex items-start gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kc-blue-100 text-kc-blue-700 sm:flex">
              <Waves className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
                Welcome to KC Swimming
              </h1>
              <p className="mt-1 text-slate-500">
                {hasSwimmers
                  ? isParent
                    ? "Your children's profiles are set up. You're ready to register."
                    : "Your profile is set up. You're ready to register."
                  : isParent
                    ? "Add a permanent swimmer profile for each child you want to register."
                    : "Create your permanent swimmer profile. It is saved once and reused for every competition."}
              </p>
            </div>
          </div>

          {/* Show existing profiles */}
          {hasSwimmers ? (
            <div className="mt-8 rounded-2xl border border-kc-green-200 bg-kc-green-50 p-6">
              <div className="flex items-center gap-2 text-kc-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <h2 className="font-bold">
                  {isParent ? "Your swimmers:" : "Your profile:"}
                </h2>
              </div>
              <ul className="mt-3 space-y-2">
                {(swimmers).map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                    <span className="font-semibold text-kc-blue-950">{p.fullName}</span>
                    <span className="text-xs text-slate-500">
                      {p.ageGroup?.name ?? "No age group"} · {p.kcMembershipNumber}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <Link href="/dashboard" className="kc-btn-green">
                  Go to my dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <div className="mb-5 flex items-center gap-2 text-kc-blue-950">
                <UserPlus className="h-5 w-5 text-kc-blue-600" />
                <h2 className="font-display text-lg font-bold uppercase">
                  {isParent ? "Add a child profile" : "Your swimmer profile"}
                </h2>
              </div>
              <ParticipantForm
                ageGroups={ageGroups.map((a) => ({
                  id: a.id,
                  name: a.name,
                  minAge: a.minAge,
                  maxAge: a.maxAge,
                  isActive: a.isActive,
                }))}
                onRedirect="/dashboard"
                submitLabel={isParent ? "Save child profile" : "Save my profile"}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}