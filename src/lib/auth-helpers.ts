import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

/**
 * Server-side session helpers.
 * IMPORTANT: Authorization is always enforced server-side. Never rely on
 * hiding frontend links alone for security.
 */

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/dashboard"));
  }
  return session;
}

export async function requireCommittee() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/committee/login");
  }
  if (session.user.role !== UserRole.COMMITTEE) {
    redirect("/committee/verify");
  }
  return session;
}

export async function requireParentOrParticipant() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.role === UserRole.COMMITTEE) {
    redirect("/committee");
  }
  return session;
}

export function isCommitteeRole(role: UserRole | undefined | null): boolean {
  return role === UserRole.COMMITTEE;
}

export function isTerminalRole(role: UserRole | undefined | null): boolean {
  return role === UserRole.PARTICIPANT || role === UserRole.PARENT;
}