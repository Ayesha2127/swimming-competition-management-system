import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ------------------------------------------------------------------
  // Strokes
  // ------------------------------------------------------------------
  const strokeNames = [
    "Freestyle",
    "Backstroke",
    "Breaststroke",
    "Butterfly",
    "Individual Medley",
  ];

  const strokes: Record<string, { id: string }> = {};
  for (const name of strokeNames) {
    const stroke = await prisma.stroke.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    strokes[name] = stroke;
  }
  console.log(`Strokes: ${Object.keys(strokes).length}`);

  // ------------------------------------------------------------------
  // Age groups
  // ------------------------------------------------------------------
  const ageGroups = [
    { name: "U-6", minAge: 4, maxAge: 6, sortOrder: 1 },
    { name: "U-8", minAge: 6, maxAge: 8, sortOrder: 2 },
    { name: "U-10", minAge: 8, maxAge: 10, sortOrder: 3 },
    { name: "U-12", minAge: 10, maxAge: 12, sortOrder: 4 },
    { name: "U-14", minAge: 12, maxAge: 14, sortOrder: 5 },
    { name: "U-16", minAge: 14, maxAge: 16, sortOrder: 6 },
    { name: "U-18", minAge: 16, maxAge: 18, sortOrder: 7 },
    { name: "U-20", minAge: 18, maxAge: 20, sortOrder: 8 },
    { name: "Open", minAge: null, maxAge: null, sortOrder: 9 },
  ];

  const ageGroupRecords: Record<string, { id: string }> = {};
  for (const ag of ageGroups) {
    const ageGroup = await prisma.ageGroup.upsert({
      where: { id: `seed-agegroup-${ag.name.toLowerCase().replace("-", "")}` },
      update: {},
      create: { id: `seed-agegroup-${ag.name.toLowerCase().replace("-", "")}`, ...ag },
    });
    ageGroupRecords[ag.name] = ageGroup;
  }
  console.log(`Age groups: ${Object.keys(ageGroupRecords).length}`);

  // ------------------------------------------------------------------
  // Events (catalog)
  // ------------------------------------------------------------------
  const eventCatalog = [
    { name: "50m Freestyle", distance: "50", stroke: "Freestyle", isRelay: false },
    { name: "100m Freestyle", distance: "100", stroke: "Freestyle", isRelay: false },
    { name: "200m Freestyle", distance: "200", stroke: "Freestyle", isRelay: false },
    { name: "50m Backstroke", distance: "50", stroke: "Backstroke", isRelay: false },
    { name: "100m Backstroke", distance: "100", stroke: "Backstroke", isRelay: false },
    { name: "50m Breaststroke", distance: "50", stroke: "Breaststroke", isRelay: false },
    { name: "100m Breaststroke", distance: "100", stroke: "Breaststroke", isRelay: false },
    { name: "50m Butterfly", distance: "50", stroke: "Butterfly", isRelay: false },
    { name: "100m Butterfly", distance: "100", stroke: "Butterfly", isRelay: false },
    { name: "200m Individual Medley", distance: "200", stroke: "Individual Medley", isRelay: false },
    { name: "4x50m Freestyle Relay", distance: "4x50", stroke: "Freestyle", isRelay: true, relaySwimmers: 4 },
    { name: "4x50m Medley Relay", distance: "4x50", stroke: "Individual Medley", isRelay: true, relaySwimmers: 4 },
  ];

  for (const ev of eventCatalog) {
    await prisma.event.upsert({
      where: { name: ev.name },
      update: {},
      create: {
        name: ev.name,
        distance: ev.distance,
        isRelay: ev.isRelay,
        relaySwimmers: ev.relaySwimmers ?? null,
        strokeId: strokes[ev.stroke].id,
      },
    });
  }
  console.log(`Events: ${eventCatalog.length}`);

  // ------------------------------------------------------------------
  // Committee member account
  // ------------------------------------------------------------------
  const committeeEmail = "committee@karachiclub.com.pk";
  const existingCommittee = await prisma.user.findUnique({
    where: { email: committeeEmail },
  });
  if (!existingCommittee) {
    const passwordHash = await bcrypt.hash("Committee@2026", 10);
    await prisma.user.create({
      data: {
        email: committeeEmail,
        name: "Karachi Club Swimming Committee",
        role: UserRole.COMMITTEE,
        passwordHash,
        committeeVerifiedAt: new Date(),
      },
    });
  } else if (existingCommittee.role !== UserRole.COMMITTEE) {
    await prisma.user.update({
      where: { email: committeeEmail },
      data: { role: UserRole.COMMITTEE, committeeVerifiedAt: new Date() },
    });
  }
  console.log("Committee account ready:", committeeEmail);

  // ------------------------------------------------------------------
  // Example competitions
  // ------------------------------------------------------------------

  // 1. Ladies Swimming Competition 2026 (past, with gallery + results)
  const ladiesCompetition = await prisma.competition.upsert({
    where: { slug: "swimming-competition-ladies-2026" },
    update: {},
    create: {
      slug: "swimming-competition-ladies-2026",
      name: "Swimming Competition Ladies 2026",
      description:
        "Karachi Club's annual ladies swimming competition. Open to all KC lady members across all age groups, from Under-6 to Open.",
      date: new Date("2026-03-08T09:00:00+05:00"),
      venue: "Karachi Club Main Swimming Pool",
      registrationOpensAt: new Date("2026-01-15T00:00:00+05:00"),
      registrationClosesAt: new Date("2026-02-28T23:59:59+05:00"),
      registrationEnabled: false,
      status: "ARCHIVED",
      maxEventsPerParticipant: 4,
      image: "/images/events/swimming-competition-ladies-2026/cover.jpg",
    },
  });

  // 2. KC Swimming Championship 2026 (upcoming, registration open)
  const championship = await prisma.competition.upsert({
    where: { slug: "kc-swimming-championship-2026" },
    update: {},
    create: {
      slug: "kc-swimming-championship-2026",
      name: "KC Swimming Championship 2026",
      description:
        "The flagship swimming championship of the Karachi Club. Individual and relay events across all age groups. Join us for a weekend of elite racing and club pride.",
      date: new Date("2026-11-20T09:00:00+05:00"),
      venue: "Karachi Club Main Swimming Pool",
      registrationOpensAt: new Date("2026-09-01T00:00:00+05:00"),
      registrationClosesAt: new Date("2026-11-10T23:59:59+05:00"),
      registrationEnabled: true,
      status: "PUBLISHED",
      maxEventsPerParticipant: 4,
      image: "/images/events/kc-swimming-championship-2026/cover.jpg",
    },
  });

  // Add rules for the championship
  const existingRules = await prisma.competitionRule.count({
    where: { competitionId: championship.id },
  });
  if (existingRules === 0) {
    await prisma.competitionRule.createMany({
      data: [
        {
          competitionId: championship.id,
          title: "Eligibility",
          content:
            "All participants must hold a valid Karachi Club membership. Participants select their own age group. The KC Membership Number is recorded for verification purposes.",
          sortOrder: 1,
        },
        {
          competitionId: championship.id,
          title: "Events",
          content:
            "Each participant may register for a maximum of 4 events. Relay teams consist of 4 registered members.",
          sortOrder: 2,
        },
        {
          competitionId: championship.id,
          title: "Registration",
          content:
            "Registration opens 01 September 2026 and closes 10 November 2026. Duplicate registrations for the same competition are not permitted. No online payment is required; competition fees are handled through existing Club membership records.",
          sortOrder: 3,
        },
        {
          competitionId: championship.id,
          title: "Conduct",
          content:
            "All swimmers must report to marshalling 30 minutes before their scheduled heat. Decisions of the referee are final.",
          sortOrder: 4,
        },
      ],
    });
  }

  // Attach events to the championship (enable a subset + relays)
  const events = await prisma.event.findMany({ orderBy: { sortOrder: "asc" } });
  const eventMap = new Map(events.map((e) => [e.name, e]));

  const championshipEventNames = [
    "50m Freestyle",
    "100m Freestyle",
    "200m Freestyle",
    "50m Backstroke",
    "50m Breaststroke",
    "100m Breaststroke",
    "50m Butterfly",
    "200m Individual Medley",
    "4x50m Freestyle Relay",
    "4x50m Medley Relay",
  ];

  const ageGroupIds = Object.values(ageGroupRecords).map((a) => a.id);

  for (let i = 0; i < championshipEventNames.length; i++) {
    const ev = eventMap.get(championshipEventNames[i]);
    if (!ev) continue;
    const ce = await prisma.competitionEvent.upsert({
      where: { competitionId_eventId: { competitionId: championship.id, eventId: ev.id } },
      update: {},
      create: {
        competitionId: championship.id,
        eventId: ev.id,
        sortOrder: i + 1,
        isEnabled: true,
      },
    });
    // set all age groups eligible
    const existingSlots = await prisma.competitionEventAgeGroup.count({
      where: { competitionEventId: ce.id },
    });
    if (existingSlots === 0) {
      await prisma.competitionEventAgeGroup.createMany({
        data: ageGroupIds.map((ageGroupId) => ({ competitionEventId: ce.id, ageGroupId })),
      });
    }
  }

  // Attach events to the ladies competition too (a subset, all age groups eligible)
  for (let i = 0; i < championshipEventNames.length; i++) {
    const ev = eventMap.get(championshipEventNames[i]);
    if (!ev) continue;
    const ce = await prisma.competitionEvent.upsert({
      where: { competitionId_eventId: { competitionId: ladiesCompetition.id, eventId: ev.id } },
      update: {},
      create: {
        competitionId: ladiesCompetition.id,
        eventId: ev.id,
        sortOrder: i + 1,
        isEnabled: true,
      },
    });
    const existingSlots = await prisma.competitionEventAgeGroup.count({
      where: { competitionEventId: ce.id },
    });
    if (existingSlots === 0) {
      await prisma.competitionEventAgeGroup.createMany({
        data: ageGroupIds.map((ageGroupId) => ({ competitionEventId: ce.id, ageGroupId })),
      });
    }
  }

  // ------------------------------------------------------------------
  // Example participant data
  // ------------------------------------------------------------------
  const existingParticipants = await prisma.participant.count();
  if (existingParticipants === 0) {
    const parent = await prisma.user.create({
      data: {
        email: "parent@example.com",
        name: "Aliya Rahman",
        role: UserRole.PARENT,
        passwordHash: await bcrypt.hash("Parent@2026", 10),
        phone: "+92 300 1112223",
      },
    });

    const child1 = await prisma.participant.create({
      data: {
        fullName: "Sana Rahman",
        dateOfBirth: new Date("2014-04-12"),
        gender: "FEMALE",
        kcMembershipNumber: "KC-2021-1187",
        phone: "+92 300 1112223",
        email: "sana.rahman@example.com",
        ageGroupId: ageGroupRecords["U-12"].id,
      },
    });

    const child2 = await prisma.participant.create({
      data: {
        fullName: "Omar Rahman",
        dateOfBirth: new Date("2017-08-23"),
        gender: "MALE",
        kcMembershipNumber: "KC-2022-0641",
        phone: "+92 300 1112223",
        ageGroupId: ageGroupRecords["U-8"].id,
      },
    });

    await prisma.parentChild.createMany({
      data: [
        { parentUserId: parent.id, participantId: child1.id },
        { parentUserId: parent.id, participantId: child2.id },
      ],
    });

    // Register Sana for the championship
    await prisma.registration.create({
      data: {
        competitionId: championship.id,
        participantId: child1.id,
        ageGroupId: ageGroupRecords["U-12"].id,
        status: "CONFIRMED",
        events: {
          create: [
            {
              competitionEvent: {
                connect: {
                  competitionId_eventId: {
                    competitionId: championship.id,
                    eventId: eventMap.get("50m Freestyle")!.id,
                  },
                },
              },
            },
            {
              competitionEvent: {
                connect: {
                  competitionId_eventId: {
                    competitionId: championship.id,
                    eventId: eventMap.get("100m Freestyle")!.id,
                  },
                },
              },
            },
            {
              competitionEvent: {
                connect: {
                  competitionId_eventId: {
                    competitionId: championship.id,
                    eventId: eventMap.get("50m Backstroke")!.id,
                  },
                },
              },
            },
          ],
        },
      },
    });
  }

  // ------------------------------------------------------------------
  // Ladies competition participants + results (idempotent; runs every seed
  // so the archived competition always has registrations and results).
  // ------------------------------------------------------------------
  const ladiesCE50Free = await prisma.competitionEvent.findUnique({
    where: {
      competitionId_eventId: {
        competitionId: ladiesCompetition.id,
        eventId: eventMap.get("50m Freestyle")!.id,
      },
    },
  });

  if (ladiesCE50Free) {
    const ladiesParticipants = [
      { name: "Ayesha Khan", dob: "2011-02-14", mem: "KC-2019-0332", ag: "U-14" },
      { name: "Mahnoor Sheikh", dob: "2012-06-30", mem: "KC-2020-0911", ag: "U-14" },
      { name: "Zara Baig", dob: "2010-11-05", mem: "KC-2018-0777", ag: "U-16" },
    ];

    const ladiesRegistrations: Record<string, string> = {};
    for (const lp of ladiesParticipants) {
      const p = await prisma.participant.upsert({
        where: { kcMembershipNumber: lp.mem },
        update: { fullName: lp.name, dateOfBirth: new Date(lp.dob), gender: "FEMALE", ageGroupId: ageGroupRecords[lp.ag].id },
        create: {
          fullName: lp.name,
          dateOfBirth: new Date(lp.dob),
          gender: "FEMALE",
          kcMembershipNumber: lp.mem,
          phone: "+92 21 555 0100",
          ageGroupId: ageGroupRecords[lp.ag].id,
        },
      });
      const reg = await prisma.registration.upsert({
        where: { competitionId_participantId: { competitionId: ladiesCompetition.id, participantId: p.id } },
        update: { ageGroupId: ageGroupRecords[lp.ag].id, status: "CONFIRMED" },
        create: {
          competitionId: ladiesCompetition.id,
          participantId: p.id,
          ageGroupId: ageGroupRecords[lp.ag].id,
          status: "CONFIRMED",
        },
      });
      await prisma.registrationEvent.createMany({
        data: [{ registrationId: reg.id, competitionEventId: ladiesCE50Free.id }],
        skipDuplicates: true,
      });
      ladiesRegistrations[lp.name] = reg.id;
    }

    const ladiesResults = [
      { participantName: "Ayesha Khan", time: "00:32.41", position: 1, medal: "GOLD" },
      { participantName: "Mahnoor Sheikh", time: "00:33.10", position: 2, medal: "SILVER" },
      { participantName: "Zara Baig", time: "00:34.22", position: 3, medal: "BRONZE" },
    ];

    for (const lr of ladiesResults) {
      const reg = await prisma.registration.findUnique({
        where: { id: ladiesRegistrations[lr.participantName] },
      });
      if (!reg) continue;
      await prisma.result.upsert({
        where: { id: `seed-result-${ladiesCE50Free.id}-${reg.participantId}` },
        update: {
          time: lr.time,
          position: lr.position,
          medal: lr.medal as "GOLD" | "SILVER" | "BRONZE",
        },
        create: {
          id: `seed-result-${ladiesCE50Free.id}-${reg.participantId}`,
          competitionId: ladiesCompetition.id,
          competitionEventId: ladiesCE50Free.id,
          ageGroupId: reg.ageGroupId,
          registrationId: reg.id,
          participantId: reg.participantId,
          time: lr.time,
          position: lr.position,
          medal: lr.medal as "GOLD" | "SILVER" | "BRONZE",
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });