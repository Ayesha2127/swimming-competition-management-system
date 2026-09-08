import { requireCommittee } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { CommitteeShell } from "@/components/committee/committee-shell";

export default async function CommitteeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCommittee();

  const [competitionCount, registrationCount, participantCount, myChildrenLinks] = await Promise.all([
    prisma.competition.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.registration.count(),
    prisma.participant.count(),
    prisma.parentChild.findMany({
      where: { parentUserId: session.user.id },
      include: { participant: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const myChildren = myChildrenLinks.map((link) => ({ id: link.participant.id, fullName: link.participant.fullName }));

  return (
    <CommitteeShell
      userName={session.user.name || "Committee Member"}
      userEmail={session.user.email || ""}
      competitionCount={competitionCount}
      registrationCount={registrationCount}
      participantCount={participantCount}
      myChildren={myChildren}
    >
      {children}
    </CommitteeShell>
  );
}