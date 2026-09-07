import { format } from "date-fns";

// ------------------------------------------------------------------
// General helpers
// ------------------------------------------------------------------

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function calculateAge(dateOfBirth: Date | string, from: Date = new Date()): number {
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  let age = from.getFullYear() - dob.getFullYear();
  const m = from.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && from.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy, h:mm a");
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "—";
  return time;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getGenderLabel(gender: string | null | undefined): string {
  return gender === "MALE" ? "Male" : gender === "FEMALE" ? "Female" : "—";
}

export function isRegistrationOpen(competition: {
  status: string;
  registrationEnabled: boolean;
  registrationOpensAt?: Date | null;
  registrationClosesAt?: Date | null;
}): boolean {
  if (competition.status !== "PUBLISHED") return false;
  if (!competition.registrationEnabled) return false;
  const now = new Date();
  if (competition.registrationOpensAt && now < new Date(competition.registrationOpensAt)) return false;
  if (competition.registrationClosesAt && now > new Date(competition.registrationClosesAt)) return false;
  return true;
}

export function prettyifySlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ------------------------------------------------------------------
// Labels for enums
// ------------------------------------------------------------------

export const medalLabels: Record<string, string> = {
  GOLD: "Gold",
  SILVER: "Silver",
  BRONZE: "Bronze",
  NONE: "—",
};

export const registrationStatusLabels: Record<string, string> = {
  REGISTERED: "Registered",
  CONFIRMED: "Confirmed",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
};

// ------------------------------------------------------------------
// Zod error helper (works with zod v4 where errors may surface as issues)
// ------------------------------------------------------------------

export function firstFieldError(error: unknown, fallback = "Invalid data"): string {
  if (error && typeof error === "object") {
    const issues = (error as { issues?: { message?: string }[] }).issues;
    if (Array.isArray(issues) && issues.length > 0 && issues[0]?.message) {
      return issues[0].message;
    }
    const errors = (error as { errors?: { message?: string }[] }).errors;
    if (Array.isArray(errors) && errors.length > 0 && errors[0]?.message) {
      return errors[0].message;
    }
  }
  return fallback;
}