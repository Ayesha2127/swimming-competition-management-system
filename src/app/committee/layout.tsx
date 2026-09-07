import { requireCommittee } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { CommitteeShell } from "@/components/committee/committee-shell";

export default async function CommitteeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCommittee();

  const [competitionCount, registrationCount, participantCount] = await Promise.all([
    prisma.competition.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.registration.count(),
    prisma.participant.count(),
  ]);

  return (
    <CommitteeShell
      userName={session.user.name || "Committee Member"}
      userEmail={session.user.email || ""}
      competitionCount={competitionCount}
      registrationCount={registrationCount}
      participantCount={participantCount}
    >
      {children}
    </CommitteeShell>
  );
}