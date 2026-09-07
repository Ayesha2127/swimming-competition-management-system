"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Settings2,
  ScrollText,
  ListOrdered,
  Images,
  ClipboardList,
  Medal as MedalIcon,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { OverviewTab } from "./overview-tab";
import { RulesTab } from "./rules-tab";
import { EventsTab } from "./events-tab";
import { GalleryTab } from "./gallery-tab";
import { RegistrationsTab } from "./registrations-tab";
import { ResultsTab } from "./results-tab";
import type { CompetitionLite, EventLite } from "./competition-types";

const TABS = [
  { id: "overview", label: "Overview", icon: Settings2 },
  { id: "rules", label: "Rules", icon: ScrollText },
  { id: "events", label: "Events", icon: ListOrdered },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "registrations", label: "Registrations", icon: ClipboardList },
  { id: "results", label: "Results", icon: MedalIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function CompetitionDetail({
  competition,
  allEvents,
  ageGroups,
  fsImages,
}: {
  competition: CompetitionLite;
  allEvents: EventLite[];
  ageGroups: { id: string; name: string }[];
  fsImages: string[];
}) {
  const [tab, setTab] = useState<TabId>("overview");

  const statusBadge =
    competition.status === "PUBLISHED"
      ? "badge-green"
      : competition.status === "ARCHIVED"
        ? "badge-slate"
        : "badge-mint";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/committee/competitions"
            className="mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:text-kc-blue-600"
            aria-label="Back to competitions"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950">
                {competition.name}
              </h1>
              <span className={cn("badge", statusBadge)}>{competition.status}</span>
              <span className={cn("badge", competition.registrationEnabled ? "badge-green" : "badge-slate")}>
                {competition.registrationEnabled ? "Open" : "Closed"}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>{formatDate(competition.date)}</span>
              {competition.venue && <span>· {competition.venue}</span>}
              <Link
                href={`/competitions/${competition.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-kc-blue-600 hover:underline"
              >
                View public page <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 rounded-2xl border border-kc-blue-100 bg-white/70 p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const count =
            t.id === "rules"
              ? competition.rules.length
              : t.id === "events"
                ? competition.events.length
                : t.id === "gallery"
                  ? competition.images.length
                  : t.id === "registrations"
                    ? competition.registrations.length
                    : competition.results.length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
                tab === t.id ? "bg-kc-blue-600 text-white" : "text-slate-600 hover:bg-kc-blue-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <span className={cn("rounded-full px-1.5 text-xs", tab === t.id ? "bg-white/20" : "bg-slate-100")}>{count}</span>
            </button>
          );
        })}
      </nav>

      {tab === "overview" && <OverviewTab competition={competition} />}
      {tab === "rules" && <RulesTab initialRules={competition.rules} competitionId={competition.id} />}
      {tab === "events" && (
        <EventsTab
          competitionId={competition.id}
          initialEvents={competition.events}
          allEvents={allEvents}
          ageGroups={ageGroups}
        />
      )}
      {tab === "gallery" && (
        <GalleryTab
          competitionId={competition.id}
          competitionSlug={competition.slug}
          initialImages={competition.images}
          fsImages={fsImages}
        />
      )}
      {tab === "registrations" && (
        <RegistrationsTab
          competitionId={competition.id}
          competitionName={competition.name}
          competitionSlug={competition.slug}
          initialRegistrations={competition.registrations}
        />
      )}
      {tab === "results" && (
        <ResultsTab
          competitionId={competition.id}
          initialResults={competition.results}
          competitionEvents={competition.events}
          registrations={competition.registrations}
        />
      )}
    </div>
  );
}