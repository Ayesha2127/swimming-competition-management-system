import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireParentOrParticipant } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { calculateAge, formatDate, getGenderLabel } from "@/lib/utils";
import { CheckCircle2, Info, UserCircle2, IdCard } from "lucide-react";
import { ProfileEditor } from "@/components/profile/profile-editor";

export default async function ProfilePage() {
  const session = await requireParentOrParticipant();

  if (session.user.role !== UserRole.PARTICIPANT) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-kc-blue-200 bg-kc-blue-50 p-8 text-center">
          <Info className="mx-auto mb-3 h-10 w-10 text-kc-blue-600" />
          <h1 className="font-display text-2xl font-bold uppercase text-kc-blue-950">
            This is a parent account
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Parent accounts manage swimmer profiles through the &quot;My Children&quot; section.
            Each child&apos;s profile holds their permanent swimmer data.
          </p>
          <Link href="/dashboard/children" className="kc-btn-primary mt-5">
            Go to My Children
          </Link>
        </div>
      </div>
    );
  }

  const participant = await prisma.participant.findUnique({
    where: { userId: session.user.id },
    include: { ageGroup: true },
  });

  const ageGroups = await prisma.ageGroup.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your permanent swimmer profile. Used for every competition registration.
        </p>
      </div>

      {!participant ? (
        <div className="kc-card p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-kc-blue-100 text-kc-blue-700">
              <UserCircle2 className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold uppercase text-kc-blue-950">
                Set up your swimmer profile
              </h2>
              <p className="text-sm text-slate-500">
                Enter your permanent details once — they will be reused for all future competitions.
              </p>
            </div>
          </div>
          {/* Profile creation is handled on the onboarding flow normally; provide shortcut */}
          <ParticipantProfileNotice />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile summary card */}
          <div className="kc-card overflow-hidden lg:col-span-1">
            <div className="bg-kc-blue-950 p-6 text-white">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-kc-green-500 font-display text-2xl font-extrabold text-kc-blue-950">
                {participant.fullName
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <h2 className="font-display text-2xl font-bold uppercase">{participant.fullName}</h2>
              <p className="text-sm text-kc-blue-200">
                {participant.ageGroup?.name ?? "No age group selected"}
              </p>
            </div>
            <dl className="divide-y divide-slate-100 px-6 py-4 text-sm">
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">Date of birth</dt>
                <dd className="font-semibold text-kc-blue-950">{formatDate(participant.dateOfBirth)}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">Age</dt>
                <dd className="font-semibold text-kc-blue-950">{calculateAge(participant.dateOfBirth)} yrs</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">Gender</dt>
                <dd className="font-semibold text-kc-blue-950">{getGenderLabel(participant.gender)}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">KC Membership No.</dt>
                <dd className="flex items-center gap-1 font-semibold text-kc-blue-950">
                  <IdCard className="h-3.5 w-3.5 text-kc-blue-500" /> {participant.kcMembershipNumber}
                </dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-semibold text-kc-blue-950">{participant.phone || "—"}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-semibold text-kc-blue-950">{participant.email || "—"}</dd>
              </div>
            </dl>
            <div className="border-t border-slate-200 px-6 py-4">
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-kc-green-500" />
                Permanent details (name, DOB, gender, membership number) are kept stable. You can
                update your contact details and age group below.
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            <ProfileEditor
              participant={{
                id: participant.id,
                phone: participant.phone,
                email: participant.email,
                ageGroupId: participant.ageGroupId,
              }}
              ageGroups={ageGroups.map((a) => ({ id: a.id, name: a.name, isActive: a.isActive }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ParticipantProfileNotice() {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
      Your swimmer profile can be set up from the onboarding assistant when you first log in. If you
      arrived here without one, please{" "}
      <Link href="/onboarding" className="font-bold text-kc-blue-600 underline">
        visit the onboarding step
      </Link>{" "}
      to create it.
    </div>
  );
}