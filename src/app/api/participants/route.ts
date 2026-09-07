import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Gender, UserRole } from "@prisma/client";

const participantSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter the full name").max(120),
  dateOfBirth: z.string().min(1, "Please select a date of birth"),
  gender: z.enum([Gender.MALE, Gender.FEMALE]),
  kcMembershipNumber: z.string().trim().min(3, "Please enter the KC membership number").max(60),
  phone: z.string().trim().min(7, "Please enter a phone number").max(40),
  email: z.string().trim().email("Please enter a valid email").max(120).optional().or(z.literal("").transform(() => undefined)),
  ageGroupId: z.string().min(1, "Please select an age group").nullable().optional(),
});

// Create a new participant (self for swimmers, child for parents, or committee-managed)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = participantSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Please check the details." }, { status: 400 });
  }

  const { fullName, dateOfBirth, gender, kcMembershipNumber, phone, email, ageGroupId } = parsed.data;

  // Validate age group exists (if provided)
  if (ageGroupId) {
    const ag = await prisma.ageGroup.findUnique({ where: { id: ageGroupId } });
    if (!ag) {
      return NextResponse.json({ error: "Invalid age group." }, { status: 400 });
    }
  }

  // Membership number uniqueness
  const duplicate = await prisma.participant.findUnique({
    where: { kcMembershipNumber },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "This KC Membership Number is already registered." },
      { status: 409 },
    );
  }

  const isCommittee = session.user.role === UserRole.COMMITTEE;

  const participant = await prisma.participant.create({
    data: {
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      kcMembershipNumber,
      phone,
      email: email || null,
      ageGroupId: ageGroupId ?? null,
      // self-link for participant accounts, null for parents/committee
      userId: isCommittee ? null : session.user.role === UserRole.PARTICIPANT ? session.user.id : null,
    },
  });

  // For parents, link the new participant as a child
  if (session.user.role === UserRole.PARENT) {
    await prisma.parentChild.create({
      data: { parentUserId: session.user.id, participantId: participant.id },
    });
  }

  return NextResponse.json({ success: true, participant }, { status: 201 });
}

// Update editable profile info (phone, email, age group)
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = body?.participantId as string | undefined;

  if (!id) {
    return NextResponse.json({ error: "Missing participant." }, { status: 400 });
  }

  const isCommittee = session.user.role === UserRole.COMMITTEE;

  // Verify ownership (self or managed child) unless committee
  if (!isCommittee) {
    const [own, childLinks] = await Promise.all([
      prisma.participant.findUnique({ where: { userId: session.user.id } }),
      prisma.parentChild.findMany({
        where: { parentUserId: session.user.id },
        select: { participantId: true },
      }),
    ]);
    const allowed = new Set([...(own ? [own.id] : []), ...childLinks.map((c) => c.participantId)]);
    if (!allowed.has(id)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }
  }

  const updateSchema = z.object({
    participantId: z.string(),
    phone: z.string().trim().min(7, "Please enter a valid phone").max(40).optional(),
    email: z.string().trim().email("Invalid email").max(120).optional().nullable(),
    ageGroupId: z.string().nullable().optional(),
  });

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Invalid data." }, { status: 400 });
  }

  const participant = await prisma.participant.update({
    where: { id },
    data: {
      phone: parsed.data.phone ?? undefined,
      email: parsed.data.email === null ? null : (parsed.data.email ?? undefined),
      ageGroupId: parsed.data.ageGroupId === null ? null : (parsed.data.ageGroupId ?? undefined),
    },
  });

  return NextResponse.json({ success: true, participant });
}