import { prisma } from "@/lib/prisma";
import { requireCommittee } from "@/lib/auth-helpers";
import { StrokesManager } from "@/components/committee/strokes-manager";
import { ShieldCheck, ShieldX, Waves } from "lucide-react";

export const metadata = { title: "Settings · Committee" };

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireCommittee();

  const [strokes, [committeeUsers, participantCount, registrationCount, competitionCount]] = await Promise.all([
    prisma.stroke.findMany({ orderBy: { name: "asc" } }),
    Promise.all([
      prisma.user.count({ where: { role: "COMMITTEE" } }),
      prisma.participant.count(),
      prisma.registration.count(),
      prisma.competition.count(),
    ]),
  ]);

  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const committeeKeyConfigured = Boolean(process.env.COMMITTEE_SECRET_KEY);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Strokes catalog, integration status and system overview.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="kc-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Waves className="h-5 w-5 text-kc-blue-500" />
            <h2 className="font-display text-lg font-bold uppercase text-kc-blue-950">Strokes catalog</h2>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            These base strokes are used to build swim events. Editing here updates the event catalog instantly.
          </p>
          <StrokesManager initial={strokes} />
        </section>

        <div className="space-y-6">
          <section className="kc-card p-6">
            <h2 className="mb-4 font-display text-lg font-bold uppercase text-kc-blue-950">Integrations</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="font-semibold text-slate-700">Google OAuth (Continue with Google)</span>
                {googleConfigured ? (
                  <span className="flex items-center gap-1 badge badge-green"><ShieldCheck className="h-3 w-3" /> Configured</span>
                ) : (
                  <span className="flex items-center gap-1 badge badge-slate"><ShieldX className="h-3 w-3" /> Not configured</span>
                )}
              </li>
              <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="font-semibold text-slate-700">Committee secret key</span>
                {committeeKeyConfigured ? (
                  <span className="flex items-center gap-1 badge badge-green"><ShieldCheck className="h-3 w-3" /> Configured</span>
                ) : (
                  <span className="flex items-center gap-1 badge badge-slate"><ShieldX className="h-3 w-3" /> Not configured</span>
                )}
              </li>
            </ul>
            <p className="mt-3 text-xs text-slate-400">
              Add <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code> and{" "}
              <code>COMMITTEE_SECRET_KEY</code> to <code>.env</code> to enable these flows.
            </p>
          </section>

          <section className="kc-card p-6">
            <h2 className="mb-4 font-display text-lg font-bold uppercase text-kc-blue-950">System overview</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-kc-blue-50 p-4">
                <p className="font-display text-2xl font-extrabold text-kc-blue-950">{participantCount}</p>
                <p className="text-xs text-slate-500">Swimmer profiles</p>
              </div>
              <div className="rounded-xl bg-kc-blue-50 p-4">
                <p className="font-display text-2xl font-extrabold text-kc-blue-950">{registrationCount}</p>
                <p className="text-xs text-slate-500">Registrations</p>
              </div>
              <div className="rounded-xl bg-kc-blue-50 p-4">
                <p className="font-display text-2xl font-extrabold text-kc-blue-950">{competitionCount}</p>
                <p className="text-xs text-slate-500">Competitions</p>
              </div>
              <div className="rounded-xl bg-kc-blue-50 p-4">
                <p className="font-display text-2xl font-extrabold text-kc-blue-950">{committeeUsers}</p>
                <p className="text-xs text-slate-500">Committee members</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}