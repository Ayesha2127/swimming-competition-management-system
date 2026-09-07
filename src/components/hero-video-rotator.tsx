"use client";

export function HeroVideoRotator() {
  return (
    <video
      className="h-full w-full object-cover scale-110"
      autoPlay
      muted
      loop
      playsInline
    >
      <source src="/video/hero-kc.mp4" type="video/mp4" />
    </video>
  );
}
