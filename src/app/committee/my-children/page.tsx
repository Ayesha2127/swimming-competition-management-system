import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Baby, Plus, Trophy, CalendarDays } from "lucide-react";

export const metadata = { title: "My Children" };

export default async function MyChildrenPage() {
  const session = await auth();

  const children = await prisma.parentChild.findMany({
    where: { parentUserId: session!.user!.id },
    include: {
      participant: {
        include: {
          ageGroup: true,
          registrations: {
            include: {
              competition: { select: { id: true, name: true, date: true, status: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const participants = children.map((c) => c.participant);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-kc-blue-950 md:text-3xl">
            My Children
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your children&apos;s profiles and register them for competitions.
          </p>
        </div>
        <Link href="/committee/my-children/new" className="kc-btn-primary">
          <Plus className="h-4 w-4" /> Add Child
        </Link>
      </div>

      {participants.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Baby className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="font-display text-lg font-bold uppercase text-slate-600">
            No children added yet
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Add your children&apos;s profiles so you can register them for competitions.
          </p>
          <Link href="/committee/my-children/new" className="kc-btn-primary mt-5">
            <Plus className="h-4 w-4" /> Add your first child
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {participants.map((child) => (
            <Link
              key={child.id}
              href={`/committee/my-children/${child.id}`}
              className="kc-card group overflow-hidden p-5 hover:-translate-y-1 hover:border-kc-blue-400 !border-kc-blue-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kc-blue-100 font-display text-lg font-bold text-kc-blue-700">
                  {child.fullName.charAt(0).toUpperCase()}
                </div>
                {child.ageGroup && (
                  <span className="rounded-full bg-kc-green-50 px-3 py-1 text-xs font-bold text-kc-green-700">
                    {child.ageGroup.name}
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-display text-lg font-bold uppercase text-kc-blue-950 group-hover:text-kc-green-700 transition-colors">
                {child.fullName}
              </h3>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p>{child.gender === "MALE" ? "Male" : "Female"} · DOB: {formatDate(child.dateOfBirth)}</p>
                <p>KC #{child.kcMembershipNumber}</p>
              </div>
              {child.registrations.length > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-kc-blue-600">
                  <Trophy className="h-3.5 w-3.5" />
                  {child.registrations.length} registration{child.registrations.length !== 1 ? "s" : ""}
                </div>
              )}
              {child.registrations.length === 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  No registrations yet
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
