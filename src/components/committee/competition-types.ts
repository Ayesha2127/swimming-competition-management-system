export interface StrokeLite {
  id: string;
  name: string;
}

export interface EventLite {
  id: string;
  name: string;
  distance: string;
  isRelay: boolean;
  relaySwimmers: number | null;
  genderType: string;
  isActive: boolean;
  sortOrder: number;
  stroke: StrokeLite | null;
}

export interface CompetitionEventLite {
  id: string;
  competitionId: string;
  eventId: string;
  isEnabled: boolean;
  sortOrder: number;
  maxParticipants: number | null;
  heatCount: number | null;
  event: EventLite;
  ageGroups: { ageGroup: { id: string; name: string } }[];
}

export interface RuleLite {
  id: string;
  competitionId: string;
  title: string | null;
  content: string;
  sortOrder: number;
}

export interface ImageLite {
  id: string;
  competitionId: string;
  path: string;
  altText: string | null;
  caption: string | null;
  sortOrder: number;
}

export interface RegistrationLite {
  id: string;
  competitionId: string;
  participantId: string;
  ageGroupId: string | null;
  status: string;
  registeredAt: string;
  notes: string | null;
  participant: {
    id: string;
    fullName: string;
    kcMembershipNumber: string;
    phone: string;
    gender: string;
    dateOfBirth: string;
  };
  ageGroup: { id: string; name: string } | null;
  events: {
    id: string;
    competitionEvent: { id: string; event: EventLite };
    relayTeam: {
      id: string;
      name: string;
      members: { participantId: string | null; fullName: string }[];
    } | null;
  }[];
  results: { id: string; medal: string }[];
}

export interface ResultLite {
  id: string;
  competitionId: string;
  competitionEventId: string;
  ageGroupId: string | null;
  registrationId: string | null;
  participantId: string | null;
  relayTeamId: string | null;
  time: string | null;
  position: number | null;
  medal: string;
  notes: string | null;
  competitionEvent: { id: string; event: EventLite };
  ageGroup: { id: string; name: string } | null;
  registration: { participant: { id: string; fullName: string } } | null;
  relayTeam: { name: string; members: { participantId: string | null; fullName: string }[] } | null;
}

export interface CompetitionLite {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  venue: string | null;
  registrationEnabled: boolean;
  status: string;
  maxEventsPerParticipant: number | null;
  image: string | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  rules: RuleLite[];
  events: CompetitionEventLite[];
  images: ImageLite[];
  registrations: RegistrationLite[];
  results: ResultLite[];
}