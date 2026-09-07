import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole, RegistrationStatus } from "@prisma/client";
import { isRegistrationOpen } from "@/lib/utils";

const relayMemberSchema = z.object({
  fullName: z.string().trim().min(1, "Relay member name is required").max(120),
  membershipNumber: z.string().trim().max(60).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

const eventSelectionSchema = z.object({
  competitionEventId: z.string().min(1),
  relayMembers: z.array(relayMemberSchema).optional(),
});

const registrationSchema = z.object({
  competitionId: z.string().min(1),
  participantId: z.string().min(1),
  ageGroupId: z.string().min(1).nullable().optional(),
  events: z.array(eventSelectionSchema).min(1, "Select at least one event"),
});

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please log in to register." }, { status: 401 });
  }

  if (session.user.role === UserRole.COMMITTEE) {
    return NextResponse.json({ error: "Committee accounts cannot register via the public form." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message || "Please check the registration details." },
      { status: 400 },
    );
  }

  const { competitionId, participantId, ageGroupId, events } = parsed.data;

  try {
    // 1. Competition must exist, be published & open
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { events: { where: { isEnabled: true }, include: { event: true, ageGroups: true } } },
    });

    if (!competition || competition.status !== "PUBLISHED") {
      return NextResponse.json({ error: "This competition is not accepting registrations." }, { status: 400 });
    }

    if (!isRegistrationOpen(competition)) {
      return NextResponse.json(
        { error: "Registration for this competition is currently closed." },
        { status: 400 },
      );
    }

    // 2. Participant must belong to the signed-in user (self or child)
    const userId = session.user.id;

    const ownParticipant = await prisma.participant.findUnique({ where: { userId } });
    const childLinks = await prisma.parentChild.findMany({
      where: { parentUserId: userId },
      select: { participantId: true },
    });

    const allowedIds = new Set([
      ...(ownParticipant ? [ownParticipant.id] : []),
      ...childLinks.map((c) => c.participantId),
    ]);

    if (!allowedIds.has(participantId)) {
      return NextResponse.json({ error: "Unauthorized participant." }, { status: 403 });
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { ageGroup: true },
    });
    if (!participant) {
      return NextResponse.json({ error: "Participant not found." }, { status: 404 });
    }

    // 3. Duplicate registration prevention (DB-level unique also protects)
    const existing = await prisma.registration.findUnique({
      where: { competitionId_participantId: { competitionId, participantId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You are already registered for this competition. Duplicate registrations are not allowed." },
        { status: 409 },
      );
    }

    // 4. Validate event selection
    const competitionEventsById = new Map(competition.events.map((ce) => [ce.id, ce]));
    const uniqueEventIds = [...new Set(events.map((e) => e.competitionEventId))];

    if (events.length !== uniqueEventIds.length) {
      return NextResponse.json({ error: "Duplicate events selected." }, { status: 400 });
    }

    const maxEvents = competition.maxEventsPerParticipant ?? null;
    if (maxEvents && events.length > maxEvents) {
      return NextResponse.json(
        { error: `You can select a maximum of ${maxEvents} events for this competition.` },
        { status: 400 },
      );
    }

    // Resolve age group: use the provided selection, else participant's profile
    const selectedAgeGroupId = ageGroupId || participant.ageGroupId;
    if (!selectedAgeGroupId) {
      return NextResponse.json({ error: "Please select an age group." }, { status: 400 });
    }

    for (const selection of events) {
      const ce = competitionEventsById.get(selection.competitionEventId);
      if (!ce) {
        return NextResponse.json({ error: "One or more selected events are not available." }, { status: 400 });
      }
      // Empty eligibility list means the event is open to all age groups
      // (the committee Events screen shows this as "All age groups").
      const eligible =
        ce.ageGroups.length === 0 || ce.ageGroups.some((ag) => ag.ageGroupId === selectedAgeGroupId);
      if (!eligible) {
        return NextResponse.json(
          { error: `${ce.event.name} is not open to the selected age group.` },
          { status: 400 },
        );
      }
      if (ce.event.isRelay) {
        const count = ce.event.relaySwimmers ?? 4;
        const members = selection.relayMembers ?? [];
        if (members.length < count) {
          return NextResponse.json(
            { error: `Please provide ${count} relay members for ${ce.event.name}.` },
            { status: 400 },
          );
        }
      }
    }

    // 5. Create registration (atomic)
    const registration = await prisma.registration.create({
      data: {
        competitionId,
        participantId,
        ageGroupId: selectedAgeGroupId,
        status: RegistrationStatus.REGISTERED,
        events: {
          create: events.map((selection) => {
            const ce = competitionEventsById.get(selection.competitionEventId)!;
            return {
              competitionEventId: selection.competitionEventId,
              ...(ce.event.isRelay
                ? {
                    relayTeam: {
                      create: {
                        name: `${participant.fullName} — ${ce.event.name}`,
                        members: {
                          create: (selection.relayMembers ?? []).map((m) => ({
                            fullName: m.fullName,
                            kcMembershipNumber: m.membershipNumber || null,
                            phone: m.phone || null,
                          })),
                        },
                      },
                    },
                  }
                : {}),
            };
          }),
        },
      },
      include: {
        participant: true,
        competition: true,
        events: { include: { competitionEvent: { include: { event: true } }, relayTeam: { include: { members: true } } } },
      },
    });

    return NextResponse.json(
      { success: true, registrationId: registration.id },
      { status: 201 },
    );
  } catch (err) {
    console.error("Registration error:", err);
    // Database-level unique violation
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "You are already registered for this competition." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Registration failed. Please try again later." }, { status: 500 });
  }
}