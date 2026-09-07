import { requireParentOrParticipant } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireParentOrParticipant();
  const userId = session.user.id;

  const [ownParticipant, childLinks, activeRegistrations] = await Promise.all([
    prisma.participant.findUnique({ where: { userId }, include: { ageGroup: true } }),
    prisma.parentChild.findMany({
      where: { parentUserId: userId },
      include: { participant: { include: { ageGroup: true } } },
    }),
    prisma.registration.count({
      where: {
        participant: {
          OR: [{ userId }, { parentLinks: { some: { parentUserId: userId } } }],
        },
        competition: { status: "PUBLISHED" },
      },
    }),
  ]);

  const swimmers =
    session.user.role === UserRole.PARENT
      ? childLinks.map((c) => c.participant)
      : ownParticipant
        ? [ownParticipant]
        : [];

  // First-time members (e.g. fresh Google sign-ins) have no swimmer profile yet —
  // route them to onboarding so they exist before interacting with the dashboard.
  if (swimmers.length === 0 && session.user.role !== UserRole.COMMITTEE) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell
      role={session.user.role}
      userName={session.user.name || "Member"}
      userEmail={session.user.email || ""}
      swimmerCount={swimmers.length}
      registrationsCount={activeRegistrations}
    >
      {children}
    </DashboardShell>
  );
}