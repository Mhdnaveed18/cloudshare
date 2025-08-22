import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FileCard from "../components/FileCard";
import apiClient from "../api/client";
import { API_URLS } from "../api/urls";
import filesApi from "../api/files";

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

export default function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  const location = useLocation();
  const q = (params.get("q") || "").trim();
  const pathSource = location.pathname.toLowerCase().startsWith("/favorites") ? "favorites" : null;
  const source = (pathSource || (params.get("source") || "all")).toLowerCase();

  function normalizeFileItem(f) {
    return {
      id: f.id ?? f._id ?? f.fileId ?? f.uuid ?? undefined,
      name: f.name ?? f.fileName ?? f.originalName ?? "Untitled",
      size: typeof f.size === "string" && /MB|KB|GB|B/i.test(f.size) ? f.size : formatSize(f.size ?? f.bytes ?? f.length),
      date: formatDate(f.date ?? f.createdAt ?? f.uploadedAt ?? f.createdOn),
      type: f.type ?? (f.mimeType?.startsWith("image/") ? "image" : (f.mimeType?.startsWith("video/") ? "video" : "doc")),
      thumbnail: f.thumbnailUrl ?? f.previewUrl ?? f.thumbnail ?? null,
      favorite: Boolean(f.favorite ?? f.isFavorite ?? f._favorite ?? false),
    };
  }

  function normalizeSharedItem(s) {
    const ct = s?.contentType || "application/octet-stream";
    const type = ct.startsWith("image/") ? "image" : (ct.startsWith("video/") ? "video" : "doc");
    return {
      id: s?.fileId ?? s?.id ?? s?._id,
      name: s?.name || "Untitled",
      size: typeof s?.size === "string" && /MB|KB|GB|B/i.test(s.size) ? s.size : formatSize(s?.size),
      date: formatDate(s?.sharedOn ?? s?.createdAt),
      type,
      thumbnail: null,
      _shared: s,
    };
  }

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let list = [];
      if (source === "favorites") {
        const res = await filesApi.favorites();
        const arr = Array.isArray(res) ? res : (res?.data ?? res?.files ?? []);
        list = arr.map(normalizeFileItem);
      } else if (source === "shared-with-me") {
        const res = await filesApi.sharedWithMe();
        const arr = Array.isArray(res) ? res : (res?.data ?? res?.list ?? []);
        list = arr.map(normalizeSharedItem);
      } else if (source === "shared-by-me") {
        const res = await filesApi.sharedByMe();
        const arr = Array.isArray(res) ? res : (res?.data ?? res?.list ?? []);
        list = arr.map(normalizeSharedItem);
      } else {
        const { data } = await apiClient.get(API_URLS.files.list());
        const arr = Array.isArray(data) ? data : (data?.data ?? data?.files ?? []);
        list = arr.map(normalizeFileItem);
      }

      // Apply query filter (client-side)
      const filtered = q ? list.filter((f) => String(f.name || "").toLowerCase().includes(q.toLowerCase())) : list;
      setFiles(filtered);
    } catch (e) {
      const message = e?.response?.data?.message || e?.message || "Failed to load files";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [q, source]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return (
    <main className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
      <div className="lg:flex lg:items-start lg:gap-8">
        <Sidebar />
        <section className="flex-1 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              {source === "favorites" ? "Favorites" : source === "shared-with-me" ? "Shared with me" : source === "shared-by-me" ? "Shared by me" : "All files"}
              {q ? <span className="ml-2 text-base font-normal text-gray-400">for "{q}"</span> : null}
            </h1>
            <button onClick={fetchFiles} className="text-sm font-medium text-blue-400 hover:underline" disabled={loading}>Refresh</button>
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
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
        </section>
      </div>
    </main>
  );
}
