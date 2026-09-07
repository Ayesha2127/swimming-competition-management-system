import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(20),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Invalid request." }, { status: 400 });
  }

  const { token, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const verification = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: normalizedEmail, token } },
  });

  if (!verification || verification.expires < new Date()) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { passwordHash },
  });

  // Invalidate the token
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: normalizedEmail, token } },
  });

  return NextResponse.json({ success: true });
}