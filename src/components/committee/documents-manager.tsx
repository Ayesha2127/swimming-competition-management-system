"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface DocumentRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  competition: { id: string; name: string } | null;
  size: number;
  createdAt: string;
  uploadedBy: { id: string; name: string | null } | null;
}

export function DocumentsManager({
  initial,
  competitions,
}: {
  initial: DocumentRow[];
  competitions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [docs, setDocs] = useState(initial);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "", competitionId: "" });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function humanSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!file) {
      setError("Please choose a file.");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", form.name || file.name);
    fd.append("description", form.description);
    fd.append("category", form.category);
    if (form.competitionId) fd.append("competitionId", form.competitionId);

    const res = await fetch("/api/documents", { method: "POST", body: fd });
    const body = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(body.error || "Upload failed.");
      return;
    }
    setFile(null);
    setForm({ name: "", description: "", category: "", competitionId: "" });
    setShowUpload(false);
    setNotice("Document uploaded.");
    refresh();
  }

  async function remove(doc: DocumentRow) {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/documents?id=${doc.id}`, { method: "DELETE" });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "Could not delete.");
      return;
    }
    setNotice("Document deleted.");
    refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-kc-green-200 bg-kc-green-50 p-3 text-sm text-kc-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
        </div>
      )}

      {showUpload && (
        <form onSubmit={upload} className="kc-card space-y-4 border-2 border-kc-blue-300 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold uppercase text-kc-blue-950">Upload document</h3>
            <button type="button" onClick={() => setShowUpload(false)} className="rounded-lg p-2 text-slate-400 hover:text-slate-600" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-kc-blue-200 bg-kc-blue-50/50 px-6 py-8 text-center hover:border-kc-blue-400">
            <UploadCloud className="h-8 w-8 text-kc-blue-400" />
            <span className="text-sm font-semibold text-kc-blue-900">
              {file ? file.name : "Choose a file to upload"}
            </span>
            <span className="text-xs text-slate-400">
              PDF, Word, Excel, CSV, TXT, images · up to 15 MB
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="d-name" className="kc-label">Document name</label>
              <input
                id="d-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="kc-input"
                placeholder="e.g. Championship 2026 — Heat Draw"
              />
            </div>
            <div>
              <label htmlFor="d-category" className="kc-label">Category</label>
              <input
                id="d-category"
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="kc-input"
                placeholder="e.g. Rules, Draws, Results"
              />
            </div>
            <div>
              <label htmlFor="d-competition" className="kc-label">Competition (optional)</label>
              <select
                id="d-competition"
                value={form.competitionId}
                onChange={(e) => setForm((f) => ({ ...f, competitionId: e.target.value }))}
                className="kc-input"
              >
                <option value="">None</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="d-desc" className="kc-label">Description</label>
              <textarea
                id="d-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="kc-input"
                placeholder="Short description…"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={uploading} className="kc-btn-primary">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Upload
            </button>
            <button type="button" onClick={() => setShowUpload(false)} className="kc-btn-outline">Cancel</button>
          </div>
        </form>
      )}

      {!showUpload && (
        <button type="button" onClick={() => setShowUpload(true)} className="kc-btn-primary">
          <UploadCloud className="h-4 w-4" /> Upload document
        </button>
      )}

      {docs.length === 0 ? (
        <div className="kc-card p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-kc-blue-200" />
          <p className="mt-4 font-display text-lg font-bold uppercase text-kc-blue-950">No documents</p>
          <p className="mt-1 text-sm text-slate-500">Uploaded files are stored outside the public folder and only visible to committee members.</p>
        </div>
      ) : (
        <div className="kc-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="kc-table min-w-[46rem]">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category</th>
                  <th>Competition</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="flex items-center gap-2 font-semibold text-kc-blue-950">
                        <FileText className="h-4 w-4 shrink-0 text-kc-blue-400" /> {d.name}
                      </span>
                      {d.description && <span className="block truncate text-xs text-slate-400">{d.description}</span>}
                    </td>
                    <td>{d.category ? <span className="badge badge-mint">{d.category}</span> : <span className="text-slate-400">—</span>}</td>
                    <td className="max-w-[12rem] truncate text-slate-500">{d.competition?.name ?? "—"}</td>
                    <td className="text-slate-500">{humanSize(d.size)}</td>
                    <td className="text-slate-500">{formatDate(d.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <a
                          href={`/api/documents/${d.id}/download`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-kc-blue-50 hover:text-kc-blue-700"
                          aria-label={`Download ${d.name}`}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => remove(d)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${d.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}