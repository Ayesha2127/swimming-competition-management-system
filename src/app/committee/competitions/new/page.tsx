import { requireCommittee } from "@/lib/auth-helpers";
import { NewCompetitionForm } from "@/components/committee/new-competition-form";

export const metadata = { title: "New Competition · Committee" };

export default async function NewCompetitionPage() {
  await requireCommittee();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          New Competition
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Set the basics now; add rules, events and eligibility from the competition&apos;s manage page.
        </p>
      </div>
      <NewCompetitionForm />
    </div>
  );
}