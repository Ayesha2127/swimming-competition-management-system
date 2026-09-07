import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const ruleSchema = z.object({
  competitionId: z.string().min(1),
  title: z.string().trim().max(160).optional().nullable(),
  content: z.string().trim().min(1, "Rule content is required"),
  sortOrder: z.coerce.number().int().min(0),
});

async function committeeOnly() {
  const session = await auth();
  return session?.user?.role === UserRole.COMMITTEE;
}

export async function POST(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);

  const createSchema = ruleSchema;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Invalid data" }, { status: 400 });
  }
  const count = await prisma.competitionRule.count({ where: { competitionId: parsed.data.competitionId } });
  const rule = await prisma.competitionRule.create({
    data: {
      competitionId: parsed.data.competitionId,
      title: parsed.data.title ?? null,
      content: parsed.data.content,
      sortOrder: parsed.data.sortOrder || count + 1,
    },
  });
  return NextResponse.json({ success: true, rule }, { status: 201 });
}

export async function PATCH(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "Missing rule id" }, { status: 400 });

  if (body?.orderedIds) {
    await prisma.$transaction(
      (body.orderedIds as string[]).map((ruleId, index) =>
        prisma.competitionRule.update({ where: { id: ruleId }, data: { sortOrder: index + 1 } }),
      ),
    );
    return NextResponse.json({ success: true });
  }

  const parsed = z.object({
    id: z.string(),
    title: z.string().trim().max(160).optional().nullable(),
    content: z.string().trim().min(1).optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  const rule = await prisma.competitionRule.update({
    where: { id },
    data: {
      title: parsed.data.title === undefined ? undefined : parsed.data.title,
      content: parsed.data.content,
      sortOrder: parsed.data.sortOrder,
    },
  });
  return NextResponse.json({ success: true, rule });
}

export async function DELETE(req: Request) {
  if (!(await committeeOnly())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing rule id" }, { status: 400 });
  await prisma.competitionRule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}