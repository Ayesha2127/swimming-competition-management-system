"use client";

import Image from "next/image";

const images = Array.from({ length: 10 }, (_, i) => ({
  src: `/home-swim-pics/hs${i + 1}.png`,
  alt: `Swimming photo ${i + 1}`,
}));

export function SwimGallery() {
  const doubled = [...images, ...images];

  return (
    <section className="py-16 md:py-20 overflow-hidden">
      <div className="kc-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-kc-green-600">Life in the pool</p>
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-kc-blue-950 md:text-5xl">
            KC Swimming <span className="text-kc-green-600">Moments</span>
          </h2>
        </div>
      </div>

      <div className="mt-10 relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div className="swim-marquee flex gap-5 w-max">
          {doubled.map((img, i) => (
            <div
              key={`${img.src}-${i}`}
              className="relative h-44 w-64 shrink-0 overflow-hidden rounded-2xl bg-kc-blue-100 sm:h-56 sm:w-80 md:h-72 md:w-96"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-500 hover:scale-110"
                sizes="(max-width: 768px) 320px, 384px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
