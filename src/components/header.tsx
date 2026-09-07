"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, LayoutDashboard, ChevronDown, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { logoPath } from "@/lib/config";
import type { Session } from "next-auth";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/registrations", label: "Registrations" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

export function Header({ session }: { session: Session | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const user = session?.user;

  const dashboardHref = user?.role === "COMMITTEE" ? "/committee" : "/dashboard";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 md:px-6 md:pt-5">
      <header
        className={`mx-auto max-w-7xl rounded-[1.25rem] border text-white transition-all duration-500 ${
          scrolled
            ? "border-white/10 bg-kc-ink/90 shadow-2xl shadow-black/30 backdrop-blur-2xl"
            : "border-white/8 bg-kc-ink/75 backdrop-blur-xl"
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-4 px-5 md:h-[4.25rem] md:px-7">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Karachi Club Swimming home">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-lg shadow-white/10 transition-all duration-300 group-hover:shadow-kc-green-400/20 group-hover:scale-105">
              <Image src={logoPath} alt="" width={40} height={40} className="h-full w-full object-contain" />
            </span>
            <span className="leading-tight hidden sm:block">
              <span className="block font-display text-base font-bold uppercase tracking-wide group-hover:text-kc-green-300 transition-colors duration-300">
                Karachi Club
              </span>
              <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-kc-green-300/70">
                Swimming
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {navLinks.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    active
                      ? "bg-kc-green-500/20 text-kc-green-300 shadow-sm shadow-kc-green-500/10"
                      : "text-white/60 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop auth */}
          <div className="hidden items-center gap-2.5 lg:flex">
            {!user && (
              <>
                <Link
                  href="/signup"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white/60 hover:bg-white/8 hover:text-white transition-all duration-300"
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="rounded-full bg-kc-green-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-kc-green-500/25 hover:bg-kc-green-600 hover:shadow-kc-green-500/35 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Login
                </Link>
              </>
            )}

            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2.5 rounded-full border border-white/12 bg-white/8 py-1 pl-1 pr-3 text-sm font-semibold hover:bg-white/14 hover:border-white/20 transition-all duration-300"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-kc-green-400/40" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-kc-green-400 to-kc-green-600 text-xs font-bold uppercase text-white">
                      {user.name?.charAt(0) || "U"}
                    </span>
                  )}
                  <span className="max-w-[7rem] truncate hidden md:block">{user.name?.split(" ")[0] || "Account"}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl shadow-slate-300/40 z-50"
                    >
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="truncate text-sm font-bold">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                      <Link
                        href={dashboardHref}
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-kc-green-50 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-kc-green-600" />
                        {user.role === "COMMITTEE" ? "Committee Dashboard" : "My Dashboard"}
                      </Link>
                      <Link
                        href="/dashboard/profile"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-kc-green-50 transition-colors"
                      >
                        <User className="h-4 w-4 text-kc-green-600" />
                        Profile
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/18 transition-all duration-300 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="border-t border-white/10 px-5 pb-5 pt-3 lg:hidden" aria-label="Mobile navigation">
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                      pathname === link.href ? "bg-kc-green-500/20 text-kc-green-300" : "text-white/60 hover:bg-white/8"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-4">
              {!user && (
                <>
                  <Link href="/signup" onClick={() => setMobileOpen(false)} className="rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/14 transition-all">
                    Sign Up
                  </Link>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-xl bg-kc-green-500 px-4 py-2.5 text-center text-sm font-bold text-white shadow-lg shadow-kc-green-500/25 hover:bg-kc-green-600 transition-all">
                    Login
                  </Link>
                </>
              )}
              {user && (
                <>
                  <Link href={dashboardHref} onClick={() => setMobileOpen(false)} className="rounded-xl bg-kc-green-500 px-4 py-2.5 text-center text-sm font-bold text-white shadow-lg shadow-kc-green-500/25 hover:bg-kc-green-600 transition-all">
                    {user.role === "COMMITTEE" ? "Committee Dashboard" : "My Dashboard"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="rounded-xl border border-red-300/50 bg-red-500/10 px-4 py-2.5 text-center text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <LogOut className="mr-1.5 inline h-4 w-4" /> Logout
                  </button>
                </>
              )}
            </div>
          </nav>
        )}
      </header>
    </div>
  );
}
