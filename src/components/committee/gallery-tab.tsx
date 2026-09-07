"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertCircle, ImagePlus, Link2, Pencil, Save, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageLite } from "./competition-types";

export function GalleryTab({
  competitionId,
  competitionSlug,
  initialImages,
  fsImages,
}: {
  competitionId: string;
  competitionSlug: string;
  initialImages: ImageLite[];
  fsImages: string[];
}) {
  const router = useRouter();
  const [images, setImages] = useState(initialImages);
  const [error, setError] = useState<string | null>(null);
  const [manualPath, setManualPath] = useState("");
  const [selectedFs, setSelectedFs] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");

  function refresh() {
    router.refresh();
  }

  async function add(path: string, cap: string) {
    setError(null);
    const res = await fetch(`/api/committee/competitions/${competitionId}/gallery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competitionId, path, caption: cap || null, altText: cap || null }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "Could not add image.");
      return;
    }
    setSelectedFs(null);
    setManualPath("");
    setCaption("");
    refresh();
  }

  async function saveEdit(id: string) {
    await fetch(`/api/committee/competitions/${competitionId}/gallery`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, caption: editCaption || null, altText: editCaption || null }),
    });
    setEditingId(null);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Remove this image from the gallery?")) return;
    await fetch(`/api/committee/competitions/${competitionId}/gallery?id=${id}`, { method: "DELETE" });
    refresh();
  }

  const inGallery = images.map((i) => i.path);
  const availableFs = fsImages.filter((p) => !inGallery.includes(p));

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="kc-card p-5">
        <h3 className="mb-2 font-display text-sm font-bold uppercase text-kc-blue-950">
          Drop images into <code className="text-kc-blue-600">public/images/events/{competitionSlug}/</code> in the repo
        </h3>
        <p className="text-sm text-slate-500">
          Files placed there will show up here. Select one (or paste a path below) to add it to this
          competition&apos;s public gallery.
        </p>

        {availableFs.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableFs.map((path) => (
              <button
                key={path}
                type="button"
                onClick={() => setSelectedFs(path)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border-2 text-left focus:outline-none",
                  selectedFs === path ? "border-kc-blue-600" : "border-slate-200 hover:border-kc-blue-300",
                )}
              >
                <Image src={path} alt="" width={640} height={400} className="h-40 w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-xs text-white">
                  {path.split("/").pop()}
                </span>
              </button>
            ))}
          </div>
        )}

        {selectedFs && (
          <form
            className="mt-4 flex flex-col gap-2 rounded-xl bg-kc-blue-50 p-4 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              add(selectedFs, caption);
            }}
          >
            <p className="flex-1 truncate text-sm font-medium text-kc-blue-900">{selectedFs}</p>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="kc-input !py-1.5 text-sm"
              placeholder="Caption (optional)"
              aria-label="Caption"
            />
            <button type="submit" className="kc-btn-primary">
              <ImagePlus className="h-4 w-4" /> Add to gallery
            </button>
            <button type="button" onClick={() => setSelectedFs(null)} className="kc-btn-outline">
              <X className="h-4 w-4" />
            </button>
          </form>
        )}

        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (manualPath) add(manualPath, "");
          }}
        >
          <div className="flex-1">
            <label htmlFor="gallery-path" className="kc-label">Or paste an image path</label>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-slate-400" />
              <input
                id="gallery-path"
                type="text"
                value={manualPath}
                onChange={(e) => setManualPath(e.target.value)}
                className="kc-input"
                placeholder="/images/events/{slug}/photo.jpg"
              />
            </div>
          </div>
          <button type="submit" disabled={!manualPath} className="kc-btn-primary">
            <ImagePlus className="h-4 w-4" /> Add path
          </button>
        </form>
      </div>

      {images.length === 0 ? (
        <div className="kc-card p-8 text-center">
          <p className="font-display text-lg font-bold uppercase text-kc-blue-950">No gallery images yet</p>
          <p className="mt-1 text-sm text-slate-500">Images added above will be shown on the public competition page.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <figure key={img.id} className="kc-card overflow-hidden">
              <div className="relative">
                <Image src={img.path} alt={img.altText ?? ""} width={640} height={400} className="h-40 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <figcaption className="flex items-center gap-2 p-3 text-sm text-slate-500">
                {editingId === img.id ? (
                  <>
                    <input
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      className="kc-input !py-1.5 text-sm"
                      placeholder="Caption"
                      aria-label="Caption"
                    />
                    <button onClick={() => saveEdit(img.id)} className="rounded-lg bg-kc-blue-600 p-2 text-white" aria-label="Save">
                      <Save className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate">{img.caption ?? img.path.split("/").pop()}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(img.id);
                        setEditCaption(img.caption ?? "");
                      }}
                      className="p-1 text-slate-400 hover:text-kc-blue-600"
                      aria-label="Edit caption"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}