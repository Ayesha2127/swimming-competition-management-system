import Image from "next/image";
import Link from "next/link";
import { logoPath, siteConfig } from "@/lib/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-kc-blue-950">
      <div className="flex flex-1">
        {/* Left visual panel */}
        <div className="relative hidden w-1/2 overflow-hidden lg:block">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/images/logo.png"
          >
            <source src="/video/hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-kc-blue-950/90 via-kc-blue-950/70 to-kc-blue-950/40" />
          <div className="absolute inset-0 bg-[radial-gradient(600px_300px_at_30%_70%,rgba(16,185,129,0.1),transparent_60%)]" />
          <div className="relative flex h-full flex-col justify-between p-12 text-white">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full shadow-lg">
                <Image src={logoPath} alt="" width={48} height={48} className="h-full w-full object-contain" />
              </span>
              <span className="font-display text-2xl font-bold uppercase tracking-wide">
                Karachi Club <span className="text-kc-green-400">Swimming</span>
              </span>
            </Link>
            <div>
              <p className="font-display text-4xl font-extrabold uppercase leading-tight">
                One profile.
                <br />
                <span className="text-kc-green-400">Every competition.</span>
              </p>
              <p className="mt-4 max-w-md text-sm text-white/70">
                Register once, then enter every KC swimming championship without re-entering your
                permanent details.
              </p>
            </div>
            <p className="text-xs text-white/40">{siteConfig.address}</p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-1 items-center justify-center bg-kc-blue-950 px-6 py-12 lg:w-1/2 lg:bg-white">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full shadow-lg">
                <Image src={logoPath} alt="" width={44} height={44} className="h-full w-full object-contain" />
              </span>
              <span className="font-display text-xl font-bold uppercase tracking-wide text-white">
                Karachi Club <span className="text-kc-green-400">Swimming</span>
              </span>
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
