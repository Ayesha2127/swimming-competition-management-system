import type { Metadata } from "next";
import { getEventGalleries } from "@/lib/galleries";
import { formatDate } from "@/lib/utils";
import { CalendarDays, Images, Award } from "lucide-react";
import { SafeImage } from "@/components/safe-image";

export const metadata: Metadata = {
  title: "Events & Galleries",
  description:
    "Past and upcoming Karachi Club swimming competitions — ladies championships, open championships, and more.",
};

export default async function EventsPage() {
  const galleries = await getEventGalleries();

  return (
    <div className="flex-1">
      <section className="kc-bg-deep py-16 pt-28 text-white md:py-24 md:pt-32">
        <div className="kc-container">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-kc-green-300">The pool at Karachi Club</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight md:text-6xl">
            Events &amp; Galleries
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            A look at our swimming competitions — from the annual ladies championship to the flagship
            KC Swimming Championship.
          </p>
        </div>
      </section>

      <section className="kc-container py-14 md:py-20">
        {galleries.length === 0 && (
          <div className="kc-card p-12 text-center">
            <Images className="mx-auto mb-4 h-12 w-12 text-kc-blue-500" />
            <h2 className="font-display text-2xl font-bold uppercase text-kc-blue-950">No galleries yet</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-500">
              Competition photos will appear here as they are published.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-12 md:gap-20">
          {galleries.map((gallery, idx) => (
            <section
              key={gallery.slug}
              id={gallery.slug}
              className="scroll-mt-24"
              aria-labelledby={`heading-${gallery.slug}`}
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2
                    id={`heading-${gallery.slug}`}
                    className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950 md:text-4xl"
                  >
                    {gallery.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
                    {gallery.date && (
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-kc-blue-500" /> {formatDate(gallery.date)}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-kc-green-500" />
                      {gallery.images.length} {gallery.images.length === 1 ? "photo" : "photos"}
                    </span>
                  </div>
                  {gallery.description && (
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                      {gallery.description}
                    </p>
                  )}
                </div>
              </div>

              {gallery.images.length > 0 ? (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {gallery.images.map((image, i) => (
                    <figure
                      key={image.path + i}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-kc-blue-100"
                    >
                      <SafeImage
                        src={image.path}
                        alt={image.alt ?? gallery.name}
                        fallbackLabel="Photo unavailable"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
                  Photos will be added soon.
                </p>
              )}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
