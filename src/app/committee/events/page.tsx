import { prisma } from "@/lib/prisma";
import { requireCommittee } from "@/lib/auth-helpers";
import { EventsManager } from "@/components/committee/events-manager";

export const metadata = { title: "Events · Committee" };

export default async function EventsPage() {
  await requireCommittee();
  const [events, strokes] = await Promise.all([
    prisma.event.findMany({
      include: { stroke: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.stroke.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          Swimming Events
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the event catalog — add, edit, reorder, enable and disable individual and relay
          events. The events available for each competition are selected separately.
        </p>
      </div>
      <EventsManager
        initial={events}
        strokes={strokes.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}