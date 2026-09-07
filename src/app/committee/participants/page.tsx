import { prisma } from "@/lib/prisma";
import { requireCommittee } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Participants · Committee" };

export const dynamic = "force-dynamic";

export default async function CommitteeParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ageGroup?: string; active?: string; page?: string }>;
}) {
  await requireCommittee();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const ageGroupFilter = sp.ageGroup ?? "ALL";
  const activeFilter = sp.active === "all" ? "all" : sp.active === "false" ? "false" : "true";

  const PAGE_SIZE = 20;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const ageGroups = await prisma.ageGroup.findMany({ orderBy: { sortOrder: "asc" } });

  const where = {
    ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" as const } }, { kcMembershipNumber: { contains: q } }, { phone: { contains: q } }] } : {}),
    ...(ageGroupFilter !== "ALL" ? { ageGroupId: ageGroupFilter } : {}),
    ...(activeFilter === "true" ? { isActive: true } : activeFilter === "false" ? { isActive: false } : {}),
  };

  const [participants, total] = await Promise.all([
    prisma.participant.findMany({
      where,
      include: {
        ageGroup: true,
        _count: { select: { registrations: true, results: true } },
      },
      orderBy: [{ fullName: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.participant.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportUrl = `/api/export?type=participants&format=xlsx&q=${encodeURIComponent(q)}&ageGroup=${encodeURIComponent(ageGroupFilter)}&active=${encodeURIComponent(activeFilter)}`;

  const filterLink = (params: Record<string, string>) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (ageGroupFilter !== "ALL") next.set("ageGroup", ageGroupFilter);
    if (activeFilter !== "true") next.set("active", activeFilter);
    for (const [k, v] of Object.entries(params)) next.set(k, v);
    return `/committee/participants?${next.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
            Participants
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} swimmer{total === 1 ? "" : "s"} with permanent profiles. Every
            registration references one of these.
          </p>
        </div>
        <a href={exportUrl} className="kc-btn-outline shrink-0">
          Export to Excel
        </a>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-3">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search name, KC number or phone…"
          className="kc-input max-w-sm"
          aria-label="Search participants"
        />
        <select name="ageGroup" defaultValue={ageGroupFilter} className="kc-input w-auto">
          <option value="ALL">All age groups</option>
          {ageGroups.map((ag) => (
            <option key={ag.id} value={ag.id}>{ag.name}</option>
          ))}
        </select>
        <select name="active" defaultValue={activeFilter} className="kc-input w-auto">
          <option value="true">Active</option>
          <option value="false">Inactive</option>
          <option value="all">All</option>
        </select>
        <button type="submit" className="kc-btn-primary">Filter</button>
      </form>

      <div className="kc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="kc-table min-w-[52rem]">
            <thead>
              <tr>
                <th>Swimmer</th>
                <th>KC #</th>
                <th>Age group</th>
                <th>Phone</th>
                <th>DOB</th>
                <th className="text-center">Registrations</th>
                <th className="text-center">Results</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {participants.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No participants match your filters.
                  </td>
                </tr>
              )}
              {participants.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      href={`/committee/participants/${p.id}`}
                      className="font-semibold text-kc-blue-600 hover:underline"
                    >
                      {p.fullName}
                    </Link>
                  </td>
                  <td className="text-slate-500">{p.kcMembershipNumber}</td>
                  <td>{p.ageGroup ? <span className="badge badge-blue">{p.ageGroup.name}</span> : <span className="text-slate-400">—</span>}</td>
                  <td className="text-slate-500">{p.phone}</td>
                  <td className="text-slate-500">{formatDate(p.dateOfBirth)}</td>
                  <td className="text-center">
                    <span className="badge badge-blue">{p._count.registrations}</span>
                  </td>
                  <td className="text-center">
                    <span className="badge badge-mint">{p._count.results}</span>
                  </td>
                  <td className="text-center">
                    <span className={cn("badge", p.isActive ? "badge-green" : "badge-slate")}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} · {total} results
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <a href={filterLink({ page: String(page - 1) })} className="kc-btn-outline !px-3 !py-1.5 text-sm">
                Previous
              </a>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <a
                key={n}
                href={filterLink({ page: String(n) })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm",
                  n === page
                    ? "border-kc-blue-600 bg-kc-blue-600 text-white"
                    : "border-slate-200 hover:border-kc-blue-600 hover:text-kc-blue-600",
                )}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </a>
            ))}
            {page < totalPages && (
              <a href={filterLink({ page: String(page + 1) })} className="kc-btn-outline !px-3 !py-1.5 text-sm">
                Next
              </a>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}