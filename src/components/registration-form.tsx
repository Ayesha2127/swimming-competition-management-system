"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Users, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ParticipantOption {
  id: string;
  fullName: string;
  ageGroupId: string | null;
  ageGroupName: string | null;
  createdAt: string;
}

export interface CompetitionEventOption {
  id: string;
  event: {
    id: string;
    name: string;
    distance: string;
    isRelay: boolean;
    relaySwimmers: number | null;
    stroke: { name: string } | null;
  };
  ageGroupIds: string[];
}

export interface RegistrationFormData {
  competitionId: string;
  competitionName: string;
  maxEventsPerParticipant: number | null;
  participants: ParticipantOption[];
  events: CompetitionEventOption[];
  ageGroups: { id: string; name: string }[];
  registeredParticipantIds: string[];
}

interface SelectedEvent {
  competitionEventId: string;
  eventName: string;
  isRelay: boolean;
  relaySwimmers: number;
  // For relay events - per team member roster
  members?: { fullName: string; membershipNumber: string; phone: string }[];
}

export function RegistrationForm({ data }: { data: RegistrationFormData }) {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string>("");
  const [ageGroupId, setAgeGroupId] = useState<string>("");
  const [selected, setSelected] = useState<SelectedEvent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const participant = useMemo(
    () => data.participants.find((p) => p.id === participantId),
    [participantId, data.participants],
  );

  // Adjust state when the selected participant changes (React-recommended
  // "derive state during render" pattern instead of a setState-in-effect).
  const [prevParticipantId, setPrevParticipantId] = useState<string | null>(null);
  if (participant && prevParticipantId !== participant.id) {
    setPrevParticipantId(participant.id);
    setAgeGroupId(participant.ageGroupId ?? "");
    setSelected([]);
    setError(null);
  }

  const eligibleEvents = useMemo(() => {
    if (!ageGroupId) return [];
    return data.events.filter((ce) => ce.ageGroupIds.includes(ageGroupId));
  }, [ageGroupId, data.events]);

  const maxEvents = data.maxEventsPerParticipant ?? Infinity;

  // Participants already registered are filtered out in the parent; but guard here too
  const selectableParticipants = participant
    ? [participant]
    : data.participants;

  function toggleEvent(compEvent: CompetitionEventOption) {
    setError(null);
    const already = selected.some((s) => s.competitionEventId === compEvent.id);
    if (already) {
      setSelected((s) => s.filter((x) => x.competitionEventId !== compEvent.id));
      return;
    }
    if (selected.length >= maxEvents) {
      setError(
        data.maxEventsPerParticipant
          ? `You can select a maximum of ${data.maxEventsPerParticipant} events.`
          : "Event limit reached.",
      );
      return;
    }
    setSelected((s) => [
      ...s,
      {
        competitionEventId: compEvent.id,
        eventName: compEvent.event.name,
        isRelay: compEvent.event.isRelay,
        relaySwimmers: compEvent.event.relaySwimmers ?? 4,
        ...(compEvent.event.isRelay
          ? {
              members: Array.from({ length: compEvent.event.relaySwimmers ?? 4 }, () => ({
                fullName: "",
                membershipNumber: "",
                phone: "",
              })),
            }
          : {}),
      },
    ]);
  }

  function updateRelayMember(
    competitionEventId: string,
    index: number,
    field: "fullName" | "membershipNumber" | "phone",
    value: string,
  ) {
    setSelected((prev) =>
      prev.map((s) =>
        s.competitionEventId === competitionEventId && s.members
          ? {
              ...s,
              members: s.members.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
            }
          : s,
      ),
    );
  }

  async function handleSubmit() {
    setError(null);
    if (!participantId) {
      setError("Please select the participant you are registering.");
      return;
    }
    if (!ageGroupId) {
      setError("Please select an age group.");
      return;
    }
    if (selected.length === 0) {
      setError("Please select at least one event.");
      return;
    }

    // Validate relay members
    for (const ev of selected) {
      if (ev.isRelay && ev.members) {
        const invalid = ev.members.some((m) => !m.fullName.trim());
        if (invalid) {
          setError(`Please enter the relay team members for ${ev.eventName}.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: data.competitionId,
          participantId,
          ageGroupId,
          events: selected.map((s) => ({
            competitionEventId: s.competitionEventId,
            relayMembers: s.members ?? undefined,
          })),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-kc-green-200 bg-kc-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-kc-green-500" />
        <h3 className="font-display text-2xl font-bold uppercase text-kc-green-700">
          Registration submitted!
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Your registration for <strong>{data.competitionName}</strong> has been received and is now
          visible in the committee dashboard. You can view it anytime from your dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => router.push("/dashboard")} className="kc-btn-primary">
            Go to my dashboard
          </button>
        </div>
      </div>
    );
  }

  if (data.participants.length === 0) {
    return (
      <div className="rounded-2xl border border-kc-green-200 bg-kc-green-50 p-8 text-center">
        <Users className="mx-auto mb-3 h-12 w-12 text-kc-green-500" />
        <h3 className="font-display text-xl font-bold uppercase text-kc-green-800">
          Complete your profile first
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          You need at least one swimmer profile before you can register. Add a swimmer profile from
          your dashboard, then come back here.
        </p>
        <button type="button" onClick={() => router.push("/dashboard/profile")} className="kc-btn-primary mt-5">
          Go to my profile
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-kc-blue-950">
        Register now
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Fill in the details below and your registration is sent to the committee instantly.
      </p>

      <div className="mt-6 space-y-6">
        {/* Participant selection */}
        <div>
          <label htmlFor="participant" className="kc-label">
            Who are you registering?
          </label>
          <select
            id="participant"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            className="kc-input"
          >
            <option value="">Please select...</option>
            {selectableParticipants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} {p.ageGroupName ? `— ${p.ageGroupName}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Age group */}
        <div>
          <label htmlFor="ageGroup" className="kc-label">
            Age group
          </label>
          <select
            id="ageGroup"
            value={ageGroupId}
            onChange={(e) => {
              setAgeGroupId(e.target.value);
              setSelected([]);
              setError(null);
            }}
            className="kc-input"
            disabled={!participant}
          >
            <option value="">Please select...</option>
            {data.events.length > 0 &&
              Array.from(new Set(data.events.flatMap((e) => e.ageGroupIds))).map((id) => {
                const ag = data.ageGroups.find((g) => g.id === id);
                return (
                  <option key={id} value={id}>
                    {ag?.name ?? id}
                  </option>
                );
              })}
          </select>
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Only events open to your selected age group will be available below.
          </p>
        </div>

        {/* Events */}
        {ageGroupId && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="kc-label !mb-0">Select events</label>
              <span className="text-xs font-semibold text-slate-500">
                {selected.length}
                {data.maxEventsPerParticipant ? ` / ${data.maxEventsPerParticipant}` : ""} selected
              </span>
            </div>

            {eligibleEvents.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No events are currently available for this age group.
              </p>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              {eligibleEvents.map((ce) => {
                const isSelected = selected.some((s) => s.competitionEventId === ce.id);
                return (
                  <div
                    key={ce.id}
                    className={cn(
                      "rounded-xl border p-3.5 transition-all",
                      isSelected
                        ? "border-kc-blue-500 bg-kc-blue-50 ring-1 ring-kc-blue-500"
                        : "border-slate-200 bg-white hover:border-kc-blue-300",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleEvent(ce)}
                      className="flex w-full items-center gap-3 text-left"
                      aria-pressed={isSelected}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold",
                          isSelected ? "border-kc-blue-600 bg-kc-blue-600 text-white" : "border-slate-300 text-transparent",
                        )}
                      >
                        ✓
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-kc-blue-950">{ce.event.name}</span>
                        <span className="block text-xs text-slate-500">
                          {ce.event.isRelay ? `Relay · ${ce.event.relaySwimmers ?? 4} swimmers` : "Individual"}
                        </span>
                      </span>
                    </button>

                    {isSelected && ce.event.isRelay && (
                      <div className="mt-3 space-y-2 border-t border-kc-blue-200 pt-3">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-kc-blue-800">
                          <Users className="h-3.5 w-3.5" /> Relay team members
                        </p>
                        {selected
                          .find((s) => s.competitionEventId === ce.id)
                          ?.members?.map((member, mi) => (
                            <div key={mi} className="grid grid-cols-1 gap-1.5 sm:grid-cols-4">
                              <input
                                type="text"
                                placeholder={`Member ${mi + 1} name`}
                                value={member.fullName}
                                onChange={(e) => updateRelayMember(ce.id, mi, "fullName", e.target.value)}
                                className="kc-input !py-2 text-xs sm:col-span-2"
                                required
                              />
                              <input
                                type="text"
                                placeholder="KC No. (optional)"
                                value={member.membershipNumber}
                                onChange={(e) => updateRelayMember(ce.id, mi, "membershipNumber", e.target.value)}
                                className="kc-input !py-2 text-xs"
                              />
                              <input
                                type="tel"
                                placeholder="Phone (optional)"
                                value={member.phone}
                                onChange={(e) => updateRelayMember(ce.id, mi, "phone", e.target.value)}
                                className="kc-input !py-2 text-xs"
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="kc-btn-primary !px-8 !py-3.5 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5" /> Register for this competition
            </>
          )}
        </button>
        <p className="text-xs text-slate-500">
          By registering you agree to the competition rules shown on this page.
        </p>
      </div>
    </div>
  );
}