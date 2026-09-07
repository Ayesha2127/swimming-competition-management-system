import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCommittee } from "@/lib/auth-helpers";
import { listEventFolderImages } from "@/lib/galleries";
import { CompetitionDetail } from "@/components/committee/competition-detail";
import type { CompetitionLite } from "@/components/committee/competition-types";

export const metadata = { title: "Competition · Committee" };

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCommittee();
  const { id } = await params;

  const [competition, allEvents, ageGroups] = await Promise.all([
    prisma.competition.findUnique({
      where: { id },
      include: {
        rules: { orderBy: { sortOrder: "asc" } },
        events: {
          include: {
            event: { include: { stroke: true } },
            ageGroups: { include: { ageGroup: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
        images: { orderBy: { sortOrder: "asc" } },
        registrations: {
          include: {
            participant: true,
            ageGroup: true,
            events: {
              include: {
                competitionEvent: { include: { event: { include: { stroke: true } } } },
                relayTeam: { include: { members: true } },
              },
            },
            results: { select: { id: true, medal: true } },
          },
          orderBy: { registeredAt: "desc" },
        },
        results: {
          include: {
            competitionEvent: { include: { event: { include: { stroke: true } } } },
            ageGroup: true,
            registration: { include: { participant: true } },
            relayTeam: { include: { members: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.event.findMany({ include: { stroke: true }, orderBy: { sortOrder: "asc" } }),
    prisma.ageGroup.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!competition) notFound();

  const serialized: CompetitionLite = {
    id: competition.id,
    name: competition.name,
    slug: competition.slug,
    description: competition.description,
    date: competition.date.toISOString(),
    venue: competition.venue,
    registrationEnabled: competition.registrationEnabled,
    status: competition.status,
    maxEventsPerParticipant: competition.maxEventsPerParticipant,
    image: competition.image,
    registrationOpensAt: competition.registrationOpensAt?.toISOString() ?? null,
    registrationClosesAt: competition.registrationClosesAt?.toISOString() ?? null,
    rules: competition.rules,
    events: competition.events,
    images: competition.images,
    registrations: competition.registrations.map((reg) => ({
      ...reg,
      registeredAt: reg.registeredAt.toISOString(),
      participant: {
        ...reg.participant,
        dateOfBirth: reg.participant.dateOfBirth.toISOString(),
      },
      ageGroup: reg.ageGroup
        ? { id: reg.ageGroup.id, name: reg.ageGroup.name }
        : null,
      events: reg.events.map((ev) => ({
        ...ev,
        relayTeam: ev.relayTeam
          ? {
              ...ev.relayTeam,
              members: ev.relayTeam.members.map((m) => ({
                participantId: m.participantId,
                fullName: m.fullName,
              })),
            }
          : null,
      })),
      results: reg.results,
    })),
    results: competition.results.map((r) => ({
      ...r,
      ageGroup: r.ageGroup ? { id: r.ageGroup.id, name: r.ageGroup.name } : null,
    })),
  };

  return (
    <CompetitionDetail
      competition={serialized}
      allEvents={allEvents}
      ageGroups={ageGroups.map((a) => ({ id: a.id, name: a.name }))}
      fsImages={listEventFolderImages(competition.slug)}
    />
  );
}