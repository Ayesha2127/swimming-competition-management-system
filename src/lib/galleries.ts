import fs from "node:fs";
import path from "node:path";
import { CompetitionStatus } from "@prisma/client";
import { prisma } from "./prisma";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const EVENTS_DIR = path.join(PUBLIC_DIR, "images", "events");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

/**
 * Absolute path to the images folder for a competition slug, e.g.
 * public/images/events/<slug>/. Returns null if the folder does not exist.
 */
export function getEventFolderPath(slug: string): string | null {
  const folder = path.join(EVENTS_DIR, slug);
  try {
    if (!fs.statSync(folder).isDirectory()) return null;
    return folder;
  } catch {
    return null;
  }
}

/**
 * Lists the image files (web-relative paths) a project owner has dropped into
 * public/images/events/<slug>/. Used by the committee gallery manager.
 */
export function listEventFolderImages(slug: string): string[] {
  const folder = getEventFolderPath(slug);
  if (!folder) return [];
  return imageFilesInFolder(folder);
}

export interface GalleryCompetition {
  slug: string;
  name: string;
  date: Date | null;
  description: string | null;
  images: {
    path: string;
    alt: string | null;
    caption: string | null;
  }[];
}

function imageFilesInFolder(folder: string): string[] {
  try {
    const files = fs
      .readdirSync(folder)
      .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .sort();
    return files.map((f) => `/images/events/${path.basename(folder)}/${f}`.replace(/\\/g, "/"));
  } catch {
    return [];
  }
}

/**
 * Builds a list of competition galleries.
 * - Starts from the database (competitions + managed gallery images).
 * - Merges in any images the project owner has dropped into
 *   public/images/events/<folder>/ so new folders appear automatically.
 */
export async function getEventGalleries(): Promise<GalleryCompetition[]> {
  const categories: CompetitionStatus[] = ["PUBLISHED", "ARCHIVED"];

  const dbCompetitions = await prisma.competition.findMany({
    where: { status: { in: categories } },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { date: "desc" },
  });

  // Scan filesystem folders for any extra galleries not in the DB
  let fsFolders: string[] = [];
  try {
    fsFolders = fs
      .readdirSync(EVENTS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    /* images/events folder may not exist yet */
  }

  const dbSlugs = new Set(dbCompetitions.map((c) => c.slug));
  const extraFolders = fsFolders.filter((f) => !dbSlugs.has(f));

  const galleries: GalleryCompetition[] = [];

  for (const competition of dbCompetitions) {
    const folderImages = imageFilesInFolder(path.join(EVENTS_DIR, competition.slug));
    const dbImagePaths = new Set(competition.images.map((i) => i.path));
    const allPaths = new Set<string>([...dbImagePaths, ...folderImages]);

    const images = Array.from(allPaths).map((p) => {
      const managed = competition.images.find((i) => i.path === p);
      return {
        path: p,
        alt: managed?.altText ?? competition.name,
        caption: managed?.caption ?? null,
      };
    });

    galleries.push({
      slug: competition.slug,
      name: competition.name,
      date: competition.date,
      description: competition.description,
      images,
    });
  }

  for (const folder of extraFolders) {
    const images = imageFilesInFolder(path.join(EVENTS_DIR, folder)).map((p) => ({
      path: p,
      alt: folder,
      caption: null,
    }));
    if (images.length === 0) continue;
    galleries.push({
      slug: folder,
      name: prettify(folder),
      date: null,
      description: null,
      images,
    });
  }

  return galleries;
}

function prettify(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}