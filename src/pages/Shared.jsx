import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import FileCard from "../components/FileCard";
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

function mapSharedToFileCardItem(s) {
  const id = s?.fileId ?? s?.id ?? s?._id;
  const name = s?.name || "Untitled";
  const size = typeof s?.size === "string" && /MB|KB|GB|B/i.test(s.size) ? s.size : formatSize(s?.size);
  const date = formatDate(s?.sharedOn ?? s?.createdAt);
  const ct = s?.contentType || "application/octet-stream";
  const type = ct.startsWith("image/") ? "image" : (ct.startsWith("video/") ? "video" : "doc");
  return { id, name, size, date, type, thumbnail: null, _shared: s };
}

export default function Shared() {
  const [tab, setTab] = useState("with"); // "with" | "by"
  const [withMe, setWithMe] = useState([]);
  const [byMe, setByMe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [a, b] = await Promise.all([
          filesApi.sharedWithMe().catch(() => ({ data: [] })),
          filesApi.sharedByMe().catch(() => ({ data: [] })),
        ]);
        const arrWith = Array.isArray(a) ? a : (a?.data ?? a?.list ?? []);
        const arrBy = Array.isArray(b) ? b : (b?.data ?? b?.list ?? []);
        if (!cancelled) {
          setWithMe(arrWith);
          setByMe(arrBy);
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || "Failed to load shared files");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const list = useMemo(() => (tab === "with" ? withMe : byMe), [tab, withMe, byMe]);

  return (
    <main className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
      <div className="lg:flex lg:items-start lg:gap-8">
        <Sidebar />
        <section className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Shared</h1>
            <div className="inline-flex rounded-lg bg-gray-800 p-1">
              <button onClick={() => setTab("with")} className={`px-3 py-1 text-sm rounded-md ${tab === "with" ? "bg-blue-600 text-white" : "text-gray-300"}`}>Shared with me</button>
              <button onClick={() => setTab("by")} className={`px-3 py-1 text-sm rounded-md ${tab === "by" ? "bg-blue-600 text-white" : "text-gray-300"}`}>Shared by me</button>
            </div>
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}
          {loading ? (
            <div className="text-sm text-gray-400">Loading...</div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {list.map((s, idx) => {
                const item = mapSharedToFileCardItem(s);
                const ownedFlag = Boolean(s?.owned);
                return (
                  <FileCard key={item.id ?? idx} file={item} canDelete={ownedFlag} />
                );
              })}
              {list.length === 0 && (
                <div className="text-sm text-gray-400">No files in this list.</div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
