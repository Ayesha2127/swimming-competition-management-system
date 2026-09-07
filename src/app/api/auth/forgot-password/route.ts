import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way to avoid leaking whether an account exists
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    // In production, email this link to the user. Here we log it server-side.
    console.log(`[password-reset] link for ${email}: ${resetUrl}`);

    return NextResponse.json({
      success: true,
      // Development convenience: show the link in the UI. Remove for production.
      devResetLink: process.env.NODE_ENV !== "production" ? resetUrl : null,
    });
  }

  return NextResponse.json({ success: true, devResetLink: null });
}