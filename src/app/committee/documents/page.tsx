import { prisma } from "@/lib/prisma";
import { requireCommittee } from "@/lib/auth-helpers";
import { DocumentsManager } from "@/components/committee/documents-manager";

export const metadata = { title: "Documents · Committee" };

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  await requireCommittee();
  const [documents, competitions] = await Promise.all([
    prisma.document.findMany({
      include: {
        competition: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.competition.findMany({ select: { id: true, name: true }, orderBy: { date: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
          Documents
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Private committee documents — stored outside the public folder, downloadable by committee
          members only.
        </p>
      </div>
      <DocumentsManager
        initial={documents.map((d) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
          size: Number(d.size),
        }))}
        competitions={competitions}
      />
    </div>
  );
}