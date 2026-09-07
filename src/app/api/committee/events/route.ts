import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { EventGenderType, UserRole } from "@prisma/client";

const eventSchema = z.object({
  name: z.string().trim().min(2, "Please enter an event name").max(80),
  distance: z.string().trim().min(1, "Please enter a distance").max(20),
  strokeId: z.string().nullable().optional(),
  isRelay: z.boolean().default(false),
  relaySwimmers: z.coerce.number().int().min(2).max(20).nullable().optional(),
  genderType: z.enum([EventGenderType.MALE, EventGenderType.FEMALE, EventGenderType.MIXED, EventGenderType.OPEN]).default(EventGenderType.OPEN),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

async function requireCommittee() {
  const session = await auth();
  return session?.user?.role === UserRole.COMMITTEE;
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== UserRole.COMMITTEE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const events = await prisma.event.findMany({
    include: { stroke: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  if (!(await requireCommittee())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Invalid data" }, { status: 400 });
  }

  const data = parsed.data;
  const duplicate = await prisma.event.findUnique({ where: { name: data.name } });
  if (duplicate) {
    return NextResponse.json({ error: "An event with this name already exists." }, { status: 409 });
  }

  const nextOrder = await prisma.event.count();
  const event = await prisma.event.create({
    data: {
      name: data.name,
      distance: data.distance,
      strokeId: data.strokeId || null,
      isRelay: data.isRelay,
      relaySwimmers: data.isRelay ? (data.relaySwimmers ?? 4) : null,
      genderType: data.genderType,
      sortOrder: data.sortOrder || nextOrder + 1,
    },
  });
  return NextResponse.json({ success: true, event }, { status: 201 });
}

export async function PATCH(req: Request) {
  if (!(await requireCommittee())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "Missing event id" }, { status: 400 });

  if (body?.orderedIds) {
    await prisma.$transaction(
      (body.orderedIds as string[]).map((eventId, index) =>
        prisma.event.update({ where: { id: eventId }, data: { sortOrder: index + 1 } }),
      ),
    );
    return NextResponse.json({ success: true });
  }

  const parsed = eventSchema.partial().safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Invalid data" }, { status: 400 });
  }

  const data = parsed.data;
  const event = await prisma.event.update({
    where: { id },
    data: {
      ...data,
      relaySwimmers: data.isRelay === false ? null : data.relaySwimmers,
    },
  });
  return NextResponse.json({ success: true, event });
}

export async function DELETE(req: Request) {
  if (!(await requireCommittee())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing event id" }, { status: 400 });

  const usage = await prisma.competitionEvent.count({ where: { eventId: id } });
  if (usage > 0) {
    await prisma.event.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true, deactivated: true });
  }
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true, deleted: true });
}