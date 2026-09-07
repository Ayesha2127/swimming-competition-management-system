import Link from "next/link";
import Image from "next/image";
import { Phone, MessageCircle, MapPin } from "lucide-react";
import { siteConfig, logoPath } from "@/lib/config";

export function Footer() {
  return (
    <footer className="bg-kc-blue-950 text-white/80">
      <div className="kc-container py-5">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full shadow-lg shadow-white/5">
              <Image src={logoPath} alt="" width={40} height={40} className="h-full w-full object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-bold uppercase tracking-wide text-white">
                Karachi Club <span className="text-kc-green-400">Swimming</span>
              </span>
              <span className="block text-[0.6rem] uppercase tracking-[0.25em] text-white/40">
                Competition Management
              </span>
            </span>
          </Link>

          <div className="flex flex-col items-center gap-3 text-sm md:flex-row md:gap-8">
            <a
              href={siteConfig.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-kc-green-300 transition-colors duration-300"
            >
              <MessageCircle className="h-4 w-4 text-kc-green-400" />
              WhatsApp
            </a>
            <a
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 hover:text-white transition-colors duration-300"
            >
              <Phone className="h-4 w-4 text-kc-green-300" />
              {siteConfig.phone}
            </a>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/40 md:flex-row md:justify-between">
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {siteConfig.address}
          </p>
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
