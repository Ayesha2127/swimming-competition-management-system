import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const ageGroupSchema = z.object({
  name: z.string().trim().min(1, "Please enter a name").max(40),
  minAge: z.coerce.number().int().min(0).max(120).nullable().optional(),
  maxAge: z.coerce.number().int().min(0).max(120).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const reorderSchema = z.object({
  orderedIds: z.array(z.string()),
});

async function isCommittee(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMMITTEE) {
    return false;
  }
  return true;
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMMITTEE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ageGroups = await prisma.ageGroup.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(ageGroups);
}

export async function POST(req: Request) {
  if (!(await isCommittee(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = ageGroupSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Invalid data" }, { status: 400 });
  }

  const data = parsed.data;
  if (data.minAge != null && data.maxAge != null && data.minAge > data.maxAge) {
    return NextResponse.json({ error: "Minimum age must be less than or equal to maximum age." }, { status: 400 });
  }

  const nextOrder = await prisma.ageGroup.count();
  const ageGroup = await prisma.ageGroup.create({
    data: {
      name: data.name,
      minAge: data.minAge ?? null,
      maxAge: data.maxAge ?? null,
      sortOrder: nextOrder + 1,
      isActive: data.isActive,
    },
  });
  return NextResponse.json({ success: true, ageGroup }, { status: 201 });
}

export async function PATCH(req: Request) {
  if (!(await isCommittee(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: "Missing age group id" }, { status: 400 });
  }

  // Reorder support
  if (body?.orderedIds) {
    const parsedReorder = reorderSchema.safeParse(body);
    if (!parsedReorder.success) {
      return NextResponse.json({ error: "Invalid reorder data" }, { status: 400 });
    }
    await prisma.$transaction(
      parsedReorder.data.orderedIds.map((ageGroupId, index) =>
        prisma.ageGroup.update({ where: { id: ageGroupId }, data: { sortOrder: index + 1 } }),
      ),
    );
    return NextResponse.json({ success: true });
  }

  const parsed = ageGroupSchema.partial().safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Invalid data" }, { status: 400 });
  }

  const data = parsed.data;
  const hasValidRange =
    data.minAge !== undefined &&
    data.maxAge !== undefined &&
    data.minAge !== null &&
    data.maxAge !== null &&
    data.minAge > data.maxAge;
  if (hasValidRange) {
    return NextResponse.json({ error: "Minimum age must be less than or equal to maximum age." }, { status: 400 });
  }

  const ageGroup = await prisma.ageGroup.update({
    where: { id },
    data,
  });
  return NextResponse.json({ success: true, ageGroup });
}

// DELETE disables an age group (soft-delete style to preserve history)
export async function DELETE(req: Request) {
  if (!(await isCommittee(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing age group id" }, { status: 400 });
  }

  // Prefer soft-disable; hard delete only if unused
  const usage = await prisma.$transaction([
    prisma.participant.count({ where: { ageGroupId: id } }),
    prisma.registration.count({ where: { ageGroupId: id } }),
  ]);
  const used = usage[0] + usage[1] > 0;

  if (used) {
    await prisma.ageGroup.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true, deactivated: true });
  }

  await prisma.ageGroup.delete({ where: { id } });
  return NextResponse.json({ success: true, deleted: true });
}