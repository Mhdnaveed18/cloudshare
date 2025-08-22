import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import UploadArea from "../components/UploadArea";
import FileCard from "../components/FileCard";
import apiClient from "../api/client";
import { API_URLS } from "../api/urls";

function formatSize(bytes) {
  if (bytes == null) return "";
  const sizes = ["B", "KB", "MB", "GB", "TB"]; 
  let i = 0; 
  let num = typeof bytes === "number" ? bytes : Number(bytes) || 0;
  while (num >= 1024 && i < sizes.length - 1) { num /= 1024; i++; }
  return `${num % 1 === 0 ? num : num.toFixed(1)} ${sizes[i]}`;
}

function formatDate(input) {
  if (!input) return "";
  const d = typeof input === "number" ? new Date(input) : new Date(String(input));
  if (isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get(API_URLS.files.list());
      // Support multiple shapes: envelope {data: [...]}, {files: [...]}, or direct array
      const list = Array.isArray(data) ? data : (data?.data ?? data?.files ?? []);
      const normalized = list.map((f) => ({
        id: f.id ?? f._id ?? f.fileId ?? f.uuid ?? undefined,
        name: f.name ?? f.fileName ?? f.originalName ?? "Untitled",
        size: typeof f.size === "string" && /MB|KB|GB|B/i.test(f.size) ? f.size : formatSize(f.size ?? f.bytes ?? f.length),
        date: formatDate(f.date ?? f.createdAt ?? f.uploadedAt ?? f.createdOn),
        type: f.type ?? (f.mimeType?.startsWith("image/") ? "image" : (f.mimeType?.startsWith("video/") ? "video" : "doc")),
        thumbnail: f.thumbnailUrl ?? f.previewUrl ?? f.thumbnail ?? null,
      }));
      setFiles(normalized);
    } catch (e) {
      const message = e?.response?.data?.message || e?.message || "Failed to load files";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return (
    <main className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
      <div className="lg:flex lg:items-start lg:gap-8">
        <Sidebar />
        <section className="flex-1 space-y-8">
          {/* Hero / Upload CTA */}
          <div className="relative overflow-hidden rounded-3xl bg-neutral-900 p-6 sm:p-8 shadow-sm">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(1250px_circle_at_10%_-20%,#1f2937,transparent_40%),radial-gradient(1250px_circle_at_90%_10%,#111827,transparent_35%)]" />
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Your files, beautifully organized</h1>
                <p className="mt-2 text-sm text-gray-400 max-w-xl">Upload, manage, and share files with a sleek interface inspired by the best. Drag and drop your files or use the upload button below.</p>
              </div>
              <a href="#upload" className="btn-gradient">
                Upload now
              </a>
            </div>
          </div>

          {/* Upload Area */}
          <div id="upload">
            <UploadArea onUploadComplete={() => { fetchFiles(); }} />
          </div>

          {/* Files grid */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Recent files</h2>
              <button onClick={fetchFiles} className="text-sm font-medium text-blue-400 hover:underline" disabled={loading}>Refresh</button>
            </div>
            {error && (
              <div className="text-sm text-red-400 mb-4">{error}</div>
            )}
            {loading ? (
              <div className="text-sm text-gray-400">Loading files...</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {files.map((f) => (
                  <FileCard key={f.id ?? f.name} file={f} onDeleted={(id) => setFiles((prev) => prev.filter((x) => (x.id ?? x.name) !== id))} />
                ))}
                {files.length === 0 && !error && (
                  <div className="text-sm text-gray-400">No files found.</div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
