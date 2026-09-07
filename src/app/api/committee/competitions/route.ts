import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CompetitionStatus, UserRole } from "@prisma/client";
import { slugify } from "@/lib/utils";

const competitionSchema = z.object({
  name: z.string().trim().min(3, "Please enter a competition name").max(160),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  date: z.string().min(1, "Please select a date"),
  venue: z.string().trim().max(200).optional().nullable(),
  registrationOpensAt: z.string().optional().nullable(),
  registrationClosesAt: z.string().optional().nullable(),
  registrationEnabled: z.boolean().optional(),
  maxEventsPerParticipant: z.coerce.number().int().min(0).max(50).optional().nullable(),
  status: z.enum([CompetitionStatus.DRAFT, CompetitionStatus.PUBLISHED, CompetitionStatus.ARCHIVED]).optional(),
  image: z.string().trim().max(500).optional().nullable(),
});

async function committeeOnly() {
  const session = await auth();
  return session?.user?.role === UserRole.COMMITTEE;
}

export async function POST(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = competitionSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  let slug = data.slug?.trim() || slugify(data.name);
  const existing = await prisma.competition.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString().slice(-6)}`;

  const competition = await prisma.competition.create({
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      date: new Date(data.date),
      venue: data.venue ?? null,
      registrationOpensAt: data.registrationOpensAt ? new Date(data.registrationOpensAt) : null,
      registrationClosesAt: data.registrationClosesAt ? new Date(data.registrationClosesAt) : null,
      registrationEnabled: data.registrationEnabled ?? false,
      maxEventsPerParticipant: data.maxEventsPerParticipant === null || data.maxEventsPerParticipant === 0 ? null : data.maxEventsPerParticipant,
      status: data.status ?? CompetitionStatus.DRAFT,
      image: data.image ?? null,
    },
  });

  return NextResponse.json({ success: true, competition }, { status: 201 });
}

export async function PATCH(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "Missing competition id" }, { status: 400 });

  // Status actions from the dashboard
  if (body?.action) {
    const action = body.action as string;
    const competition = await prisma.competition.findUnique({ where: { id } });
    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    const next = { ...competition };
    switch (action) {
      case "publish":
        next.status = CompetitionStatus.PUBLISHED;
        break;
      case "unpublish":
        next.status = CompetitionStatus.DRAFT;
        next.registrationEnabled = false;
        break;
      case "open":
        next.registrationEnabled = true;
        next.status = CompetitionStatus.PUBLISHED;
        break;
      case "close":
        next.registrationEnabled = false;
        break;
      case "reopen":
        next.registrationEnabled = true;
        next.status = CompetitionStatus.PUBLISHED;
        break;
      case "archive":
        next.status = CompetitionStatus.ARCHIVED;
        next.registrationEnabled = false;
        break;
      case "draft":
        next.status = CompetitionStatus.DRAFT;
        next.registrationEnabled = false;
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await prisma.competition.update({
      where: { id },
      data: { status: next.status, registrationEnabled: next.registrationEnabled },
    });
    return NextResponse.json({ success: true, competition: next });
  }

  const parsed = competitionSchema.partial().safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  const competition = await prisma.competition.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
      ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
      ...(data.venue !== undefined ? { venue: data.venue ?? null } : {}),
      ...(data.registrationOpensAt !== undefined ? { registrationOpensAt: data.registrationOpensAt ? new Date(data.registrationOpensAt) : null } : {}),
      ...(data.registrationClosesAt !== undefined ? { registrationClosesAt: data.registrationClosesAt ? new Date(data.registrationClosesAt) : null } : {}),
      ...(data.registrationEnabled !== undefined ? { registrationEnabled: data.registrationEnabled } : {}),
      ...(data.maxEventsPerParticipant !== undefined ? { maxEventsPerParticipant: data.maxEventsPerParticipant === 0 ? null : data.maxEventsPerParticipant } : {}),
      ...(data.image !== undefined ? { image: data.image ?? null } : {}),
    },
  });

  return NextResponse.json({ success: true, competition });
}

export async function DELETE(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing competition id" }, { status: 400 });

  const usage = await prisma.registration.count({ where: { competitionId: id } });
  if (usage > 0) {
    await prisma.competition.update({ where: { id }, data: { status: CompetitionStatus.ARCHIVED, registrationEnabled: false } });
    return NextResponse.json({ success: true, archived: true });
  }
  await prisma.competition.delete({ where: { id } });
  return NextResponse.json({ success: true, deleted: true });
}