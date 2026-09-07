"use client";

import { SessionProvider } from "next-auth/react";
import { Preloader } from "@/components/preloader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Preloader />
      {children}
    </SessionProvider>
  );
}