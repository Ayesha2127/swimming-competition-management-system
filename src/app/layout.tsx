import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { siteConfig } from "@/lib/config";
import "./globals.css";
import { Providers } from "@/components/providers";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} · Competition Management`,
    template: `%s · ${siteConfig.name}`,
  },
  description:
    "Karachi Club Swimming Competition Management System — register for swimming competitions, manage your profile, and follow KC swimming events.",
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} · Swimming Competitions`,
    description:
      "Register for Karachi Club swimming competitions and follow KC swimming events.",
    images: [{ url: "/images/logo.png", width: 512, height: 512, alt: siteConfig.name }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full antialiased ${playfair.variable} ${dmSans.variable}`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}