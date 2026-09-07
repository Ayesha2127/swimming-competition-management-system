import { prisma } from "@/lib/prisma";
import { requireCommittee } from "@/lib/auth-helpers";
import { AgeGroupsManager } from "@/components/committee/age-groups-manager";

export const metadata = { title: "Age Groups · Committee" };

export default async function AgeGroupsPage() {
  await requireCommittee();
  const ageGroups = await prisma.ageGroup.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          Age Groups
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create, edit, reorder, enable and disable age groups — no coding required. Age groups drive
          event eligibility across competitions.
        </p>
      </div>
      <AgeGroupsManager initial={ageGroups} />
    </div>
  );
}