import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

async function committeeOnly() {
  const session = await auth();
  return session?.user?.role === UserRole.COMMITTEE;
}

export async function GET() {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const strokes = await prisma.stroke.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(strokes);
}

export async function POST(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = z.object({ name: z.string().trim().min(1).max(40) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid stroke name" }, { status: 400 });

  const existing = await prisma.stroke.findUnique({ where: { name: parsed.data.name } });
  if (existing) return NextResponse.json({ error: "Stroke already exists" }, { status: 409 });

  const stroke = await prisma.stroke.create({ data: { name: parsed.data.name } });
  return NextResponse.json({ success: true, stroke }, { status: 201 });
}

export async function PATCH(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "Missing stroke id" }, { status: 400 });
  const stroke = await prisma.stroke.update({
    where: { id },
    data: { name: body?.name, isActive: body?.isActive },
  });
  return NextResponse.json({ success: true, stroke });
}

export async function DELETE(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing stroke id" }, { status: 400 });

  const usage = await prisma.event.count({ where: { strokeId: id } });
  if (usage > 0) {
    await prisma.stroke.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true, deactivated: true });
  }
  await prisma.stroke.delete({ where: { id } });
  return NextResponse.json({ success: true, deleted: true });
}