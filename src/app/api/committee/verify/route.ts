import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const keySchema = z.object({
  committeeKey: z.string().trim().min(1, "Please enter the committee key"),
});

// Validates the committee key server-side and elevates the user's role.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = keySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter the committee key." }, { status: 400 });
  }

  // Read the committee secret key directly from the server environment only.
  // It must never be bundled into client-side code.
  const expected = process.env.COMMITTEE_SECRET_KEY;
  if (!expected) {
    console.error("COMMITTEE_SECRET_KEY is not configured on the server.");
    return NextResponse.json({ error: "Committee access is not configured." }, { status: 500 });
  }

  // Constant-time-ish comparison (simple equality is fine here; value is a shared key)
  if (parsed.data.committeeKey !== expected) {
    return NextResponse.json({ error: "Invalid committee key." }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { role: UserRole.COMMITTEE, committeeVerifiedAt: new Date() },
  });

  return NextResponse.json({ success: true, role: user.role });
}