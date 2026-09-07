import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Medal, UserRole } from "@prisma/client";

async function committeeOnly() {
  const session = await auth();
  return session?.user?.role === UserRole.COMMITTEE;
}

const resultSchema = z.object({
  competitionId: z.string().min(1),
  competitionEventId: z.string().min(1),
  ageGroupId: z.string().optional().nullable(),
  registrationId: z.string().optional().nullable(),
  relayTeamId: z.string().optional().nullable(),
  time: z.string().trim().max(40).optional().nullable(),
  position: z.coerce.number().int().min(1).optional().nullable(),
  medal: z.enum([Medal.GOLD, Medal.SILVER, Medal.BRONZE, Medal.NONE]).default(Medal.NONE),
  notes: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = resultSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Invalid data" }, { status: 400 });
  }

  // Resolve participant id from registration
  let participantId: string | null = null;
  if (parsed.data.registrationId) {
    const reg = await prisma.registration.findUnique({
      where: { id: parsed.data.registrationId },
      select: { participantId: true },
    });
    participantId = reg?.participantId ?? null;
  }

  const result = await prisma.result.create({
    data: {
      competitionId: parsed.data.competitionId,
      competitionEventId: parsed.data.competitionEventId,
      ageGroupId: parsed.data.ageGroupId ?? null,
      registrationId: parsed.data.registrationId ?? null,
      relayTeamId: parsed.data.relayTeamId ?? null,
      participantId,
      time: parsed.data.time ?? null,
      position: parsed.data.position ?? null,
      medal: parsed.data.medal,
      notes: parsed.data.notes ?? null,
    },
  });
  return NextResponse.json({ success: true, result }, { status: 201 });
}

export async function PATCH(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "Missing result id" }, { status: 400 });

  const res = await prisma.result.findUnique({ where: { id } });
  if (!res) return NextResponse.json({ error: "Result not found" }, { status: 404 });

  let participantId = res.participantId;
  if (body?.registrationId && body.registrationId !== res.registrationId) {
    const reg = await prisma.registration.findUnique({
      where: { id: body.registrationId },
      select: { participantId: true },
    });
    participantId = reg?.participantId ?? null;
  }

  const result = await prisma.result.update({
    where: { id },
    data: {
      competitionEventId: body?.competitionEventId ?? undefined,
      ageGroupId: body?.ageGroupId !== undefined ? body.ageGroupId : undefined,
      registrationId: body?.registrationId !== undefined ? body.registrationId : undefined,
      relayTeamId: body?.relayTeamId !== undefined ? body.relayTeamId : undefined,
      participantId,
      time: body?.time !== undefined ? body.time : undefined,
      position: body?.position !== undefined ? body.position : undefined,
      medal: body?.medal !== undefined ? body.medal : undefined,
      notes: body?.notes !== undefined ? body.notes : undefined,
    },
  });
  return NextResponse.json({ success: true, result });
}

export async function DELETE(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing result id" }, { status: 400 });
  await prisma.result.delete({ where: { id } });
  return NextResponse.json({ success: true });
}