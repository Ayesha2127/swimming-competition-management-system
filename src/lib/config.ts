// ------------------------------------------------------------------
// Centralized site configuration.
// Change these values in one place. Secrets live in environment vars.
// ------------------------------------------------------------------

export const siteConfig = {
  name: process.env.SITE_NAME || "Karachi Club Swimming",
  shortName: "KC Swimming",
  url: process.env.NEXTAUTH_URL || "http://localhost:3000",
  email: process.env.SITE_EMAIL || "swimming@karachiclub.com.pk",
  phone: process.env.SITE_PHONE || "03002849957",
  whatsapp: process.env.SITE_WHATSAPP || "+92 300 0000000",
  address: "22 Dr Ziauddin Ahmed Rd, Civil Lines, Karachi, Pakistan",
  // WhatsApp chat link - number must be in international format without +
  whatsappLink: `https://wa.me/${(process.env.SITE_WHATSAPP || "+923000000000").replace(/[^0-9]/g, "")}`,
  facebook: "https://facebook.com/karachiclubswimming",
  instagram: "https://instagram.com/karachiclubswimming",
};

export const logoPath = "/images/logo.png";
export const heroVideoPath = "/video/hero.mp4";

export const registrationStatusLabels: Record<string, string> = {
  REGISTERED: "Registered",
  CONFIRMED: "Confirmed",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
};

export const competitionStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const medalLabels: Record<string, string> = {
  GOLD: "Gold",
  SILVER: "Silver",
  BRONZE: "Bronze",
  NONE: "—",
};