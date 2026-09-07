import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Per-competition event configuration.
// Supports: attach, detach, toggle enabled, set eligibility age groups, reorder.
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== UserRole.COMMITTEE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z.object({
    competitionId: z.string().min(1),
    eventId: z.string().min(1),
    ageGroupIds: z.array(z.string()).optional(),
  }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { competitionId, eventId, ageGroupIds } = parsed.data;

  // Attach event to competition
  const count = await prisma.competitionEvent.count({ where: { competitionId } });
  const competitionEvent = await prisma.competitionEvent.create({
    data: {
      competitionId,
      eventId,
      sortOrder: count + 1,
      ageGroups: ageGroupIds?.length
        ? { create: ageGroupIds.map((ageGroupId) => ({ ageGroupId })) }
        : undefined,
    },
  });

  return NextResponse.json({ success: true, competitionEvent }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== UserRole.COMMITTEE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const competitionId = body?.competitionId as string | undefined;
  if (!competitionId) return NextResponse.json({ error: "Missing competition id" }, { status: 400 });

  // Reorder competition events
  if (body?.orderedIds?.length) {
    await prisma.$transaction(
      (body.orderedIds as string[]).map((competitionEventId, index) =>
        prisma.competitionEvent.update({ where: { id: competitionEventId }, data: { sortOrder: index + 1 } }),
      ),
    );
    return NextResponse.json({ success: true });
  }

  const competitionEventId = body?.competitionEventId as string | undefined;
  if (!competitionEventId) return NextResponse.json({ error: "Missing competition event id" }, { status: 400 });

  if (body?.ageGroupIds) {
    const ageGroupIds = body.ageGroupIds as string[];
    // Replace eligibility age groups
    await prisma.$transaction([
      prisma.competitionEventAgeGroup.deleteMany({ where: { competitionEventId } }),
      ...(ageGroupIds.length
        ? [
            prisma.competitionEventAgeGroup.createMany({
              data: ageGroupIds.map((ageGroupId) => ({ competitionEventId, ageGroupId })),
            }),
          ]
        : []),
    ]);
    return NextResponse.json({ success: true });
  }

  // Toggle enabled/disabled
  const ev = await prisma.competitionEvent.findUnique({ where: { id: competitionEventId } });
  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.competitionEvent.update({
    where: { id: competitionEventId },
    data: { isEnabled: body?.isEnabled ?? !ev.isEnabled },
  });
  return NextResponse.json({ success: true, competitionEvent: updated });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user?.role !== UserRole.COMMITTEE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const competitionEventId = url.searchParams.get("id");
  if (!competitionEventId) return NextResponse.json({ error: "Missing competition event id" }, { status: 400 });

  // Only allow removal if no registrations reference it, else disable
  const usage = await prisma.registrationEvent.count({ where: { competitionEventId } });
  if (usage > 0) {
    await prisma.competitionEvent.update({ where: { id: competitionEventId }, data: { isEnabled: false } });
    return NextResponse.json({ success: true, deactivated: true });
  }
  await prisma.competitionEvent.delete({ where: { id: competitionEventId } });
  return NextResponse.json({ success: true, deleted: true });
}