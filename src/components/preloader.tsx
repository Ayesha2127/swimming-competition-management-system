"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { logoPath } from "@/lib/config";

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(
      () => {
        setVisible(false);
        const cleanup = setTimeout(() => setHidden(true), 800);
        return () => clearTimeout(cleanup);
      },
      reduceMotion ? 150 : 2200,
    );
    return () => clearTimeout(timer);
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-800 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ background: "linear-gradient(180deg, #0a1e38 0%, #0e2544 40%, #0c2d4a 100%)" }}
    >
      {/* Deep water ambient glow */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-kc-green-500/5 blur-[100px]" />
        <div className="absolute left-1/3 top-1/3 h-[300px] w-[300px] rounded-full bg-kc-mint-400/5 blur-[80px]" />
      </div>

      {/* Animated water wave layers */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] overflow-hidden">
        {/* Wave 1 - back */}
        <svg
          className="preloader-wave-1 absolute bottom-0 w-[200%]"
          viewBox="0 0 2400 120"
          preserveAspectRatio="none"
          style={{ height: "100px" }}
        >
          <path
            d="M0,60 C200,20 400,100 600,60 C800,20 1000,100 1200,60 C1400,20 1600,100 1800,60 C2000,20 2200,100 2400,60 L2400,120 L0,120 Z"
            fill="rgba(16, 185, 129, 0.06)"
          />
        </svg>
        {/* Wave 2 - mid */}
        <svg
          className="preloader-wave-2 absolute bottom-0 w-[200%]"
          viewBox="0 0 2400 120"
          preserveAspectRatio="none"
          style={{ height: "80px" }}
        >
          <path
            d="M0,80 C300,40 500,100 800,60 C1100,20 1300,90 1600,50 C1900,10 2100,80 2400,60 L2400,120 L0,120 Z"
            fill="rgba(45, 212, 191, 0.05)"
          />
        </svg>
        {/* Wave 3 - front */}
        <svg
          className="preloader-wave-3 absolute bottom-0 w-[200%]"
          viewBox="0 0 2400 120"
          preserveAspectRatio="none"
          style={{ height: "60px" }}
        >
          <path
            d="M0,50 C150,90 350,30 600,70 C850,110 1050,20 1300,60 C1550,100 1750,30 2000,70 C2250,110 2350,50 2400,60 L2400,120 L0,120 Z"
            fill="rgba(16, 185, 129, 0.08)"
          />
        </svg>
      </div>

      {/* Floating water particles */}
      <div className="preloader-particle preloader-particle-1 absolute left-[20%] top-[30%] h-1 w-1 rounded-full bg-kc-green-400/30" />
      <div className="preloader-particle preloader-particle-2 absolute left-[75%] top-[25%] h-1.5 w-1.5 rounded-full bg-kc-mint-400/20" />
      <div className="preloader-particle preloader-particle-3 absolute left-[60%] top-[65%] h-1 w-1 rounded-full bg-kc-green-300/25" />
      <div className="preloader-particle preloader-particle-4 absolute left-[30%] top-[70%] h-0.5 w-0.5 rounded-full bg-kc-mint-300/30" />
      <div className="preloader-particle preloader-particle-5 absolute left-[85%] top-[55%] h-1 w-1 rounded-full bg-kc-green-400/20" />

      {/* Main content */}
      <div className="relative flex flex-col items-center">
        {/* Logo with water ripple rings */}
        <div className="relative">
          {/* Ripple rings expanding outward */}
          <div className="preloader-ripple-ring preloader-ripple-ring-1 absolute inset-[-24px] rounded-full border border-kc-green-400/30" />
          <div className="preloader-ripple-ring preloader-ripple-ring-2 absolute inset-[-24px] rounded-full border border-kc-mint-400/20" />
          <div className="preloader-ripple-ring preloader-ripple-ring-3 absolute inset-[-24px] rounded-full border border-kc-green-300/15" />

          {/* Water surface glow behind logo */}
          <div className="absolute inset-[-30px] rounded-full bg-kc-green-500/10 blur-xl preloader-glow" />

          {/* Logo circle with water effect */}
          <div className="relative h-36 w-36 overflow-hidden rounded-full shadow-2xl shadow-kc-green-500/20 preloader-logo-pulse">
            <Image
              src={logoPath}
              alt="Karachi Club Swimming logo"
              width={144}
              height={144}
              className="h-full w-full object-contain"
              priority
            />
            {/* Water surface shimmer across logo */}
            <div className="preloader-water-surface absolute inset-0" />
            {/* Light refraction line */}
            <div className="preloader-light-line absolute left-[-20%] right-[-20%] top-[40%] h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent blur-[1px]" />
          </div>
        </div>

        {/* Text */}
        <div className="mt-8 text-center">
          <p className="font-display text-2xl font-bold uppercase tracking-[0.2em] text-white/90">
            Karachi Club
          </p>
          <p className="mt-1 font-display text-sm font-semibold uppercase tracking-[0.4em] text-kc-green-400/80">
            Swimming
          </p>
        </div>

        {/* Animated loading dots styled as water drops */}
        <div className="mt-5 flex items-center gap-2">
          <span className="preloader-drop preloader-drop-1 h-2 w-2 rounded-full bg-kc-green-400" />
          <span className="preloader-drop preloader-drop-2 h-2 w-2 rounded-full bg-kc-mint-400" />
          <span className="preloader-drop preloader-drop-3 h-2 w-2 rounded-full bg-kc-green-300" />
        </div>
      </div>
    </div>
  );
}
