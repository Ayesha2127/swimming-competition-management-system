"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Trophy,
  Waves,
  Layers,
  Medal,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  ShieldCheck,
} from "lucide-react";
import { logoPath } from "@/lib/config";
import { cn } from "@/lib/utils";

interface CommitteeShellProps {
  userName: string;
  userEmail: string;
  competitionCount: number;
  registrationCount: number;
  participantCount: number;
  children: React.ReactNode;
}

export function CommitteeShell({
  userName,
  userEmail,
  competitionCount,
  registrationCount,
  participantCount,
  children,
}: CommitteeShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/committee", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/committee/participants", label: "Participants", icon: Users },
    { href: "/committee/registrations", label: "Registrations", icon: ClipboardList },
    { href: "/committee/competitions", label: "Competitions", icon: Trophy },
    { href: "/committee/events", label: "Events", icon: Waves },
    { href: "/committee/age-groups", label: "Age Groups", icon: Layers },
    { href: "/committee/results", label: "Results", icon: Medal },
    { href: "/committee/documents", label: "Documents", icon: FileText },
    { href: "/committee/settings", label: "Settings", icon: Settings },
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <Link href="/committee" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
            <Image src={logoPath} alt="" width={40} height={40} className="h-full w-full object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-bold uppercase tracking-wide text-white">
              KC Swimming
            </span>
            <span className="block text-[0.55rem] uppercase tracking-[0.2em] text-kc-green-300">
              Committee
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="text-kc-blue-200 hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Committee navigation">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                active
                  ? "bg-kc-green-600 text-white shadow-lg shadow-kc-green-600/20"
                  : "text-kc-blue-200 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-kc-green-500 font-display text-sm font-bold text-kc-blue-950">
            {userName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            <p className="flex items-center gap-1 truncate text-xs text-kc-blue-300">
              <ShieldCheck className="h-3 w-3 text-kc-green-400" /> Committee Member
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-kc-blue-200">
          <div className="rounded-lg bg-white/5 py-2">
            <p className="font-display text-lg font-bold text-white">{participantCount}</p>
            <p>Participants</p>
          </div>
          <div className="rounded-lg bg-white/5 py-2">
            <p className="font-display text-lg font-bold text-white">{registrationCount}</p>
            <p>Registrations</p>
          </div>
          <div className="rounded-lg bg-white/5 py-2">
            <p className="font-display text-lg font-bold text-white">{competitionCount}</p>
            <p>Competitions</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-kc-blue-100 hover:bg-white/10"
          >
            <Home className="h-3.5 w-3.5" /> Site
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-72 shrink-0 bg-kc-blue-950 lg:block" aria-label="Sidebar">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-kc-blue-950 shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-display text-sm font-bold uppercase tracking-wide text-kc-blue-950">
              Committee Dashboard
            </span>
          </div>
          <span className="badge-green">Committee</span>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>

        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-400">
          Committee Area — authorized members only. All access is logged and protected server-side.
        </footer>
      </div>
    </div>
  );
}
