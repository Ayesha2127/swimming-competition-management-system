import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireParentOrParticipant } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { calculateAge, formatDate, getGenderLabel } from "@/lib/utils";
import { UserPlus, Users, IdCard, ClipboardList } from "lucide-react";
import { ParticipantForm } from "@/components/profile/participant-form";

export default async function ChildrenPage() {
  const session = await requireParentOrParticipant();

  const ageGroups = await prisma.ageGroup.findMany({ orderBy: { sortOrder: "asc" } });

  // Parents manage their children; swimmers don't see this page
  if (session.user.role !== UserRole.PARENT) {
    return (
      <div className="kc-card p-8 text-center">
        <h1 className="font-display text-2xl font-bold uppercase text-kc-blue-950">My Children</h1>
        <p className="mt-2 text-sm text-slate-500">
          This section is for parent / guardian accounts. On a swimmer account you manage your own
          profile instead.
        </p>
        <Link href="/dashboard/profile" className="kc-btn-primary mt-5">
          Go to my profile
        </Link>
      </div>
    );
  }

  const children = await prisma.parentChild.findMany({
    where: { parentUserId: session.user.id },
    include: {
      participant: {
        include: {
          ageGroup: true,
          registrations: { include: { competition: { select: { name: true } } } },
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          My Children
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Add and manage swimmer profiles for your children. Each child has their own permanent
          profile used for competition registrations.
        </p>
      </div>

      {/* Children list */}
      <div className="grid gap-4 md:grid-cols-2">
        {children.length === 0 && (
          <div className="kc-card col-span-full flex flex-col items-center p-10 text-center text-slate-500">
            <Users className="mb-3 h-12 w-12 text-kc-blue-300" />
            <p className="font-semibold text-slate-600">No swimmers added yet.</p>
            <p className="mt-1 text-sm">Use the form to add your first child.</p>
          </div>
        )}

        {children.map(({ participant }) => (
          <div key={participant.id} className="kc-card overflow-hidden">
            <div className="bg-kc-blue-950 p-5 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-kc-green-500 font-display text-lg font-extrabold text-kc-blue-950">
                  {participant.fullName
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold uppercase">{participant.fullName}</h2>
                  <p className="text-xs text-kc-blue-200">
                    {participant.ageGroup?.name ?? "No age group"} · {calculateAge(participant.dateOfBirth)} yrs
                  </p>
                </div>
              </div>
            </div>
            <dl className="divide-y divide-slate-100 px-5 py-2 text-sm">
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-500">Date of birth</dt>
                <dd className="font-semibold text-kc-blue-950">{formatDate(participant.dateOfBirth)}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-500">Gender</dt>
                <dd className="font-semibold text-kc-blue-950 capitalize">
                  {getGenderLabel(participant.gender).toLowerCase()}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-500">KC Membership No.</dt>
                <dd className="flex items-center gap-1 font-semibold text-kc-blue-950">
                  <IdCard className="h-3.5 w-3.5 text-kc-blue-500" />
                  {participant.kcMembershipNumber}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-semibold text-kc-blue-950">{participant.phone || "—"}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-500">Registrations</dt>
                <dd className="flex items-center gap-1 font-semibold text-kc-blue-950">
                  <ClipboardList className="h-3.5 w-3.5 text-kc-green-500" />
                  {participant.registrations.length}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* Add child form */}
      <div className="kc-card p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-kc-green-100 text-kc-green-600">
            <UserPlus className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold uppercase text-kc-blue-950">Add a child</h2>
            <p className="text-sm text-slate-500">
              Create a permanent swimmer profile for your child.
            </p>
          </div>
        </div>
        <ParticipantForm
          ageGroups={ageGroups.map((a) => ({
            id: a.id,
            name: a.name,
            minAge: a.minAge,
            maxAge: a.maxAge,
            isActive: a.isActive,
          }))}
          submitLabel="Add child profile"
        />
      </div>
    </div>
  );
}