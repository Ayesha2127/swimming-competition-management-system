import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const childSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(120),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  kcMembershipNumber: z.string().trim().min(1, "KC membership number is required").max(60),
  phone: z.string().trim().min(1, "Phone is required").max(40),
  email: z.string().trim().email().optional().or(z.literal("")),
  ageGroupId: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.COMMITTEE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const children = await prisma.parentChild.findMany({
    where: { parentUserId: session.user.id },
    include: {
      participant: {
        include: {
          ageGroup: true,
          registrations: {
            include: {
              competition: { select: { id: true, name: true, date: true, status: true } },
              events: { include: { competitionEvent: { include: { event: true } } } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ children: children.map((c) => c.participant) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.COMMITTEE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = childSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Please check the details." }, { status: 400 });
  }

  const { fullName, dateOfBirth, gender, kcMembershipNumber, phone, email, ageGroupId } = parsed.data;

  // Check unique membership number
  const existing = await prisma.participant.findUnique({ where: { kcMembershipNumber } });
  if (existing) {
    return NextResponse.json({ error: "A participant with this KC membership number already exists." }, { status: 409 });
  }

  const participant = await prisma.participant.create({
    data: {
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      kcMembershipNumber,
      phone,
      email: email || null,
      ageGroupId: ageGroupId || null,
    },
  });

  await prisma.parentChild.create({
    data: {
      parentUserId: session.user.id,
      participantId: participant.id,
    },
  });

  return NextResponse.json({ success: true, childId: participant.id }, { status: 201 });
}
