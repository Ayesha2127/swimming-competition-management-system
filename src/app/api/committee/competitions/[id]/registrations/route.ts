import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { RegistrationStatus, UserRole } from "@prisma/client";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== UserRole.COMMITTEE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: competitionId } = await ctx.params;
  const body = await req.json().catch(() => null);

  const parsed = z.object({
    registrationId: z.string().min(1),
    status: z.enum([RegistrationStatus.REGISTERED, RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING, RegistrationStatus.CANCELLED]),
  }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const registration = await prisma.registration.findFirst({
    where: { id: parsed.data.registrationId, competitionId },
  });
  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  await prisma.registration.update({
    where: { id: registration.id },
    data: { status: parsed.data.status },
  });

  // Remove any results kept for a cancelled registration? Keep history; notify not needed here.
  return NextResponse.json({ success: true });
}