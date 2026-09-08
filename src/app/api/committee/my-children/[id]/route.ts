import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.COMMITTEE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  // Verify the child belongs to this committee member
  const link = await prisma.parentChild.findUnique({
    where: {
      parentUserId_participantId: {
        parentUserId: session.user.id,
        participantId: id,
      },
    },
  });

  if (!link) {
    return NextResponse.json({ error: "Child not found." }, { status: 404 });
  }

  // Delete the ParentChild link first, then the participant
  await prisma.parentChild.delete({ where: { id: link.id } });
  await prisma.participant.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
