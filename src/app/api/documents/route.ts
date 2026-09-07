import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "private", "uploads", "documents");

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt", ".png", ".jpg", ".jpeg", ".webp"]);

async function committeeOnly() {
  const session = await auth();
  if (session?.user?.role !== UserRole.COMMITTEE) return null;
  return session;
}

export async function GET() {
  const session = await committeeOnly();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documents = await prisma.document.findMany({
    include: { competition: { select: { id: true, name: true } }, uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  const session = await committeeOnly();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }
  const MAX_SIZE = 15 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 15 MB limit" }, { status: 400 });
  }

  const name = (form.get("name") as string | null)?.trim() || file.name;
  const description = (form.get("description") as string | null)?.trim() || null;
  const category = (form.get("category") as string | null)?.trim() || null;
  const competitionId = (form.get("competitionId") as string | null) || null;

  const id = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${id}-${safeName}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    const document = await prisma.document.create({
      data: {
        name,
        description,
        category,
        competitionId,
        fileName,
        filePath,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        uploadedById: session.user.id,
      },
    });
    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json({ error: "Could not store file" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await committeeOnly();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing document id" }, { status: 400 });

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  try {
    await fs.unlink(path.join(UPLOAD_DIR, document.fileName)).catch(() => {});
  } catch {
    /* file already missing */
  }
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}