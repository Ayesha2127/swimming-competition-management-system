import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

async function committeeOnly() {
  const session = await auth();
  return session?.user?.role === UserRole.COMMITTEE;
}

export async function POST(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    competitionId: z.string().min(1),
    path: z.string().trim().min(1, "Image path is required").max(500),
    altText: z.string().trim().max(200).optional().nullable(),
    caption: z.string().trim().max(200).optional().nullable(),
  }).safeParse(body);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Invalid data" }, { status: 400 });
  }

  const count = await prisma.competitionImage.count({ where: { competitionId: parsed.data.competitionId } });
  const image = await prisma.competitionImage.create({
    data: {
      competitionId: parsed.data.competitionId,
      path: parsed.data.path,
      altText: parsed.data.altText ?? null,
      caption: parsed.data.caption ?? null,
      sortOrder: count + 1,
    },
  });
  return NextResponse.json({ success: true, image }, { status: 201 });
}

export async function PATCH(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "Missing image id" }, { status: 400 });
  const image = await prisma.competitionImage.update({
    where: { id },
    data: {
      path: body?.path ?? undefined,
      altText: body?.altText,
      caption: body?.caption,
      sortOrder: body?.sortOrder,
    },
  });
  return NextResponse.json({ success: true, image });
}

export async function DELETE(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing image id" }, { status: 400 });
  await prisma.competitionImage.delete({ where: { id } });
  return NextResponse.json({ success: true });
}