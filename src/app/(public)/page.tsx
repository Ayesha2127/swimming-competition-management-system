import { prisma } from "@/lib/prisma";
import { isRegistrationOpen } from "@/lib/utils";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import {
  Trophy,
  Users,
  ClipboardList,
  CalendarDays,
  ArrowRight,
  Phone,
  MessageCircle,
  Waves,
  Sparkles,
  Medal,
} from "lucide-react";
import { siteConfig } from "@/lib/config";
import { SafeImage } from "@/components/safe-image";
import { HeroVideoRotator } from "@/components/hero-video-rotator";
import { SwimGallery } from "@/components/swim-gallery";

export default function HomePage() {
  return (
    <>
      <HeroVideo />
      <HowItWorks />
      <SwimGallery />
      <UpcomingCompetitions />
      <EventsPreview />
      <ContactCta />
    </>
  );
}

/* ------------------------------------------------------------------ */

async function HeroVideo() {
  const competitions = await prisma.competition.findMany({
    where: { status: { in: ["PUBLISHED"] } },
    select: { slug: true, name: true },
    orderBy: { date: "desc" },
  });

  return (
    <section className="relative min-h-screen overflow-hidden bg-kc-blue-950">
      {/* Hero video / fallback */}
      <div className="absolute inset-0">
        <HeroVideoRotator />
        <div className="absolute inset-0 bg-gradient-to-t from-kc-blue-950/80 via-kc-blue-950/40 to-kc-blue-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-kc-blue-950/40 to-transparent" />
        {/* Subtle green accent glow */}
        <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_20%_80%,rgba(16,185,129,0.08),transparent_60%)]" />
      </div>

      {/* content */}
      <div className="kc-container relative flex min-h-screen flex-col justify-center py-20 md:py-28">
        <div className="max-w-2xl animate-fade-in-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-kc-green-400/30 bg-kc-green-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-kc-green-300">
            <Waves className="h-4 w-4" />
            Karachi Club · Est. Swimming Section
          </p>
          <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] text-white sm:text-5xl md:text-7xl" style={{ textShadow: "0 0 10px rgba(14, 37, 68, 0.5), 0 0 25px rgba(14, 37, 68, 0.3), 2px 2px 0 rgba(14, 37, 68, 0.4), -1px -1px 0 rgba(14, 37, 68, 0.35), 2px -1px 0 rgba(14, 37, 68, 0.35), -1px 2px 0 rgba(14, 37, 68, 0.35)" }}>
            Swim Fast
            <br />
            <span className="text-kc-green-400" style={{ textShadow: "0 0 20px rgba(14, 37, 68, 0.5), 0 0 50px rgba(14, 37, 68, 0.3), 2px 2px 0 rgba(14, 37, 68, 0.5), -1px -1px 0 rgba(14, 37, 68, 0.4), 2px -1px 0 rgba(14, 37, 68, 0.4), -1px 2px 0 rgba(14, 37, 68, 0.4)" }}>Race Bold</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            Where every stroke counts and every champion is made. Dive into Karachi Club's
            premier swimming competitions. Your journey from the starting block to the
            podium begins here.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/registrations" className="kc-btn-green !px-7 !py-3.5 !text-base !border-2 !border-kc-blue-900/60 hover:!border-kc-blue-900 hover:!shadow-kc-blue-900/30 hover:!shadow-xl">
              Register for a Competition
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/events" className="!border-2 !border-kc-green-400/60 !text-kc-green-300 hover:!bg-kc-green-500/15 hover:!border-kc-green-400 hover:!shadow-kc-green-400/10 hover:!shadow-xl inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold transition-all duration-300">
              Explore Events
            </Link>
          </div>
        </div>

        {/* quick stats */}
        <div className="mt-8 grid grid-cols-3 gap-2 md:mt-10 md:gap-3">
          {[
            { icon: CalendarDays, value: `${competitions.length}+`, label: "Competitions" },
            { icon: Users, value: "100%", label: "Online" },
            { icon: Medal, value: "All Ages", label: "U-6 to Open" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-2 py-4 text-center backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:scale-105 hover:border-white/20 sm:px-4 sm:py-5 md:rounded-2xl"
            >
              <stat.icon className="mb-1 h-5 w-5 text-kc-green-300 md:h-6 md:w-6" />
              <p className="font-display text-sm font-bold text-white md:text-lg">{stat.value}</p>
              <p className="text-[0.55rem] text-white/50 md:text-[0.65rem]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 70" fill="none" className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 35Q90 0 180 20T360 35T540 15T720 35T900 20T1080 35T1260 15T1440 35V70H0V35Z"
            fill="white"
            opacity="0.08"
          />
          <path d="M0 50Q120 25 240 40T480 50T720 40T960 50T1200 40T1440 50V70H0V50Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
async function HowItWorks() {
  const steps = [
    {
      icon: ClipboardList,
      title: "Create once",
      text: "Set up your swimmer profile — name, DOB, gender, KC membership number, and age group. It's saved permanently.",
    },
    {
      icon: Trophy,
      title: "Register in minutes",
      text: "Pick an open competition, read the rules, select your events (up to the competition limit), and submit instantly.",
    },
    {
      icon: Users,
      title: "Committee receives it",
      text: "Your registration lands directly in the committee database automatically. No paper, no WhatsApp forms.",
    },
    {
      icon: Medal,
      title: "Track results & history",
      text: "Follow your registrations, results, and competition history from one simple dashboard.",
    },
  ];

  return (
    <section className="kc-bg-water-gradient py-20 md:py-28">
      <div className="kc-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-kc-green-600">How it works</p>
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-kc-blue-950 md:text-5xl">
            One profile. <span className="text-kc-green-600">Every competition.</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            No more re-entering your permanent details for every event. Enter once and stay ready
            for every future KC swimming competition.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="kc-card group relative overflow-hidden border-kc-blue-200 p-6 transition-all duration-300 hover:border-kc-blue-400 hover:shadow-kc-blue-200/30">
              <span className="absolute -right-3 -top-4 font-display text-7xl font-extrabold text-kc-blue-100 select-none">
                {i + 1}
              </span>
              <span className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-kc-blue-700 text-white shadow-lg shadow-kc-blue-700/20">
                <step.icon className="h-6 w-6" />
              </span>
              <h3 className="relative mb-2 font-display text-xl font-bold uppercase tracking-wide text-kc-blue-950">
                {step.title}
              </h3>
              <p className="relative text-sm leading-relaxed text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
async function UpcomingCompetitions() {
  const competitions = await prisma.competition.findMany({
    where: { status: { in: ["PUBLISHED"] } },
    include: {
      events: {
        where: { isEnabled: true },
        include: { event: true },
      },
    },
    orderBy: { date: "asc" },
    take: 3,
  });

  return (
    <section className="py-20 md:py-28">
      <div className="kc-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-kc-blue-600">Registrations open</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight text-kc-blue-950 md:text-5xl">
              Upcoming Competitions
            </h2>
          </div>
          <Link href="/registrations" className="kc-btn-outline self-start">
            View all registrations <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {competitions.length === 0 && (
            <div className="kc-card col-span-full p-10 text-center text-slate-500">
              No competitions are open right now — check back soon.
            </div>
          )}
          {competitions.map((competition) => {
            const open = isRegistrationOpen(competition);
            const eventCount = competition.events.length;
            return (
              <Link
                key={competition.id}
                href={`/competitions/${competition.slug}`}
                className="kc-card group overflow-hidden !border-kc-blue-600 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-kc-blue-200/30 hover:!border-kc-blue-400"
              >
                <div className="flex items-center justify-between">
                  <span className={cn(open ? "badge-green" : "badge-blue")}>
                    {open ? "● Registration Open" : "Published"}
                  </span>
                  <span className="badge-slate">
                    <CalendarDays className="mr-1 h-3 w-3" />
                    {formatDate(competition.date)}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-kc-blue-800 group-hover:text-kc-green-700 transition-colors duration-300">
                  {competition.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{competition.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">
                    {eventCount} {eventCount === 1 ? "event" : "events"} ·{" "}
                    {competition.maxEventsPerParticipant
                      ? `max ${competition.maxEventsPerParticipant}`
                      : "no event limit"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-kc-green-600 group-hover:gap-2 transition-all duration-300">
                    {open ? "Register" : "View"} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
async function EventsPreview() {
  const competitions = await prisma.competition.findMany({
    where: { status: "PUBLISHED" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { date: "desc" },
    take: 2,
  });

  return (
    <section className="kc-bg-deep py-20 text-white md:py-28">
      <div className="kc-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-kc-green-300">Past & upcoming</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
              Competition Gallery
            </h2>
          </div>
          <Link href="/events" className="kc-btn-outline-light self-start">
            Explore all events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {competitions.map((competition) => {
            const cover =
              competition.images[0]?.path ||
              (competition.image ?? null) ||
              `/images/events/${competition.slug}/cover.jpg`;
            const galleryCount = competition.images.length;
            return (
              <Link
                key={competition.id}
                href={`/events#${competition.slug}`}
                className="group relative block overflow-hidden rounded-3xl"
              >
                <div className="aspect-[16/9] w-full bg-kc-blue-900">
                  <SafeImage
                    src={cover}
                    alt={competition.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-kc-blue-950/90 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-display text-2xl font-bold uppercase tracking-wide group-hover:text-kc-green-300 transition-colors duration-300">
                    {competition.name}
                  </h3>
                  <p className="mt-1 text-sm text-white/70">
                    {formatDate(competition.date)}
                    {galleryCount > 0 && ` · ${galleryCount} photos`}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
function ContactCta() {
  return (
    <section className="py-20 md:py-24">
      <div className="kc-container">
        <div className="relative overflow-hidden rounded-3xl bg-kc-blue-800 p-10 text-white md:p-14">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-kc-green-400/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-kc-mint-400/10 blur-3xl" />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-kc-green-300">
                <Sparkles className="h-4 w-4" /> Questions?
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
                Talk to the KC Swimming Committee
              </h2>
              <p className="mt-3 text-white/80">
                Reach us on WhatsApp or through the contact page and we will help you with
                registrations, eligibility, and everything else.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={siteConfig.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="kc-btn-green !px-6 !py-3.5"
              >
                <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
              </a>
              <a href="/contact" className="kc-btn-outline-light !px-6 !py-3.5">
                <Phone className="h-5 w-5" /> Contact Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
