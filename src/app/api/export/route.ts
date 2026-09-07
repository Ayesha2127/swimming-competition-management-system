import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { UserRole } from "@prisma/client";

// Competitions that are at least published on the public site can be exported.
// The committee area exports full registration detail; the public results page
// uses its own route. Only COMMITTEE members may export the full dataset.

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== UserRole.COMMITTEE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const competitionId = url.searchParams.get("competitionId");
  const type = url.searchParams.get("type") ?? "registrations";
  const format = url.searchParams.get("format") ?? "csv";

  if (type === "participants") {
    const q = (url.searchParams.get("q") ?? "").trim();
    const ageGroupFilter = url.searchParams.get("ageGroup") ?? "ALL";
    const activeFilter = url.searchParams.get("active") ?? "true";

    const participants = await prisma.participant.findMany({
      where: {
        ...(q
          ? { OR: [{ fullName: { contains: q, mode: "insensitive" as const } }, { kcMembershipNumber: { contains: q } }, { phone: { contains: q } }] }
          : {}),
        ...(ageGroupFilter !== "ALL" ? { ageGroupId: ageGroupFilter } : {}),
        ...(activeFilter === "true" ? { isActive: true } : activeFilter === "false" ? { isActive: false } : {}),
      },
      include: {
        ageGroup: true,
        parentLinks: { include: { parent: true } },
        _count: { select: { registrations: true, results: true } },
      },
      orderBy: [{ fullName: "asc" }],
    });

    const rows = participants.map((p) => ({
      Name: p.fullName,
      "KC Membership #": p.kcMembershipNumber,
      Gender: p.gender,
      "Date of Birth": p.dateOfBirth.toISOString().slice(0, 10),
      Phone: p.phone,
      "Age Group": p.ageGroup?.name ?? "",
      Status: p.isActive ? "Active" : "Inactive",
      Registrations: p._count.registrations,
      Results: p._count.results,
      "Linked Parents": p.parentLinks.map((l) => l.parent.name).join(" | "),
    }));

    return xlsxOrCsv(rows, "participants", format);
  }

  let competition;
  if (competitionId) {
    competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { registrations: { include: { participant: true, ageGroup: true, events: { include: { competitionEvent: { include: { event: true } }, relayTeam: { include: { members: true } } } } } } },
    });
    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const rows = (competition?.registrations ?? []).map((reg) => ({
    "Swimmer Name": reg.participant.fullName,
    "KC Membership #": reg.participant.kcMembershipNumber,
    Gender: reg.participant.gender,
    "Date of Birth": reg.participant.dateOfBirth.toISOString().slice(0, 10),
    Phone: reg.participant.phone,
    "Age Group": reg.ageGroup?.name ?? "",
    Status: reg.status,
    "Registered At": reg.registeredAt.toISOString(),
    "Events Entered": reg.events.map((ev) => ev.competitionEvent.event.name + (ev.relayTeam ? ` [${ev.relayTeam.name}]` : "")).join(" | "),
  }));

  const filename = competition ? `${competition.slug}-registrations` : "registrations";

  return xlsxOrCsv(rows, filename, format);
}

// Shared helper: serialize a row array as XLSX or CSV with a downloadable filename.
function xlsxOrCsv(rows: Record<string, unknown>[], filename: string, format: string) {
  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Data");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  // CSV
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}