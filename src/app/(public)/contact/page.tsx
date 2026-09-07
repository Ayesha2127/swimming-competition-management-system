import type { Metadata } from "next";
import { Phone, MapPin, MessageCircle, Clock } from "lucide-react";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the Karachi Club Swimming Committee. Reach us on WhatsApp, phone, or email.",
};

export default function ContactPage() {
  return (
    <div className="flex-1">
      <section className="kc-bg-hero-gradient py-16 pt-28 text-white md:py-24 md:pt-32">
        <div className="kc-container">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-kc-green-300">Contact us</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight md:text-6xl">
            KC Swimming Committee
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-kc-blue-100/90">
            Have a question about a competition, eligibility, or registration? We are happy to help.
          </p>
        </div>
      </section>

      <section className="kc-container py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Contact channels */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <a
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
              className="kc-card group flex items-center gap-4 p-5 hover:shadow-lg transition-shadow"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kc-blue-100 text-kc-blue-600">
                <Phone className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Phone
                </span>
                <span className="block font-bold text-kc-blue-950 group-hover:text-kc-blue-600 transition-colors">
                  {siteConfig.phone}
                </span>
              </span>
            </a>

            <div className="kc-card flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <MapPin className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Venue
                </span>
                <span className="block font-bold text-kc-blue-950">{siteConfig.address}</span>
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm aspect-video">
              <iframe
                src="https://maps.google.com/maps?q=Karachi+Club,+22+Dr+Ziauddin+Ahmed+Rd,+Civil+Lines+Karachi,+Pakistan&t=&z=17&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Karachi Club Location"
              />
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-3xl kc-bg-deep p-8 text-white md:p-10">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-kc-green-400/20 blur-2xl" />
              <div className="relative">
                <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight">
                  Fastest way to reach us
                </h2>
                <p className="mt-3 max-w-lg text-white/85">
                  Send us a message on WhatsApp for quick answers about registrations, age groups,
                  events, and competition rules.
                </p>
                <a
                  href={siteConfig.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kc-btn-green mt-6 !px-7 !py-3.5 !text-base"
                >
                  <MessageCircle className="h-5 w-5" />
                  Start a WhatsApp chat
                </a>
                <div className="mt-8 flex items-center gap-3 text-sm text-white/80">
                  <Clock className="h-4 w-4 text-kc-green-300" />
                  Committee responses are typically sent within a day.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
