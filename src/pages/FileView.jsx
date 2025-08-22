import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { HiOutlineArrowDownTray, HiOutlineShare, HiOutlineTrash, HiOutlineDocument, HiOutlinePhoto, HiOutlineFilm } from "react-icons/hi2";
import filesApi from "../api/files";
import { toast } from "react-toastify";

function fileIcon(type = "doc") {
  const map = {
    image: <HiOutlinePhoto className="h-8 w-8" />,
    video: <HiOutlineFilm className="h-8 w-8" />,
    doc: <HiOutlineDocument className="h-8 w-8" />,
  };
  return map[type] ?? map.doc;
}

export default function FileView() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const resp = await filesApi.view(id);
      // support different response shapes
      const f = resp?.data ?? resp?.file ?? resp;
      const normalized = {
        id: f?.id ?? f?._id ?? f?.fileId ?? id,
        name: f?.name ?? f?.fileName ?? f?.originalName ?? "Untitled",
        size: f?.size ?? f?.bytes ?? undefined,
        mimeType: f?.mimeType ?? f?.type ?? "",
        type: f?.mimeType?.startsWith("image/") ? "image" : (f?.mimeType?.startsWith("video/") ? "video" : "doc"),
        fileUrl: f?.fileUrl ?? f?.publicUrl ?? f?.url ?? null,
        thumbnail: f?.thumbnailUrl ?? f?.previewUrl ?? f?.thumbnail ?? null,
        createdAt: f?.createdAt ?? f?.uploadedAt ?? f?.createdOn ?? null,
        isPublic: Boolean(f?.isPublic ?? (!!(f?.fileUrl ?? f?.publicUrl))),
      };
      setFile(normalized);
    } catch (e) {
      const message = e?.response?.data?.message || e?.message || "Failed to load file";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onDownload() {
    try {
      const resp = await filesApi.downloadUrl(id);
      const url = resp?.data?.downloadUrl ?? resp?.downloadUrl ?? resp?.url;
      if (url) {
        window.open(url, "_blank", "noopener");
      } else if (file?.fileUrl) {
        window.open(file.fileUrl, "_blank", "noopener");
      } else {
        toast.error("Download URL not available");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to get download URL");
    }
  }

  async function onShare() {
    try {
      // Prefer the public file URL from view response
      if (file?.fileUrl) {
        await navigator.clipboard.writeText(file.fileUrl);
        toast.success("Public link copied to clipboard");
        return;
      }
      // Fallback: copy the app view URL
      const appUrl = `${window.location.origin}/file/${id}`;
      await navigator.clipboard.writeText(appUrl);
      toast.info("View link copied (file may not be public)");
    } catch {
      toast.error("Failed to copy link");
    }
  }

  async function onDelete() {
    if (!confirm("Delete this file permanently?")) return;
    try {
      await filesApi.delete(id);
      toast.success("File deleted");
      // navigate back to home
      window.location.href = "/";
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Delete failed");
    }
  }

  const ext = file?.name?.split(".").pop()?.toUpperCase() || "";

  return (
    <main className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-4"><Link to="/" className="text-sm text-blue-400 hover:underline">← Back to files</Link></div>
      {loading && <div className="text-sm text-gray-400">Loading file...</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}
      {file && (
        <div className="rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
          <div className="relative bg-gray-100 dark:bg-gray-800 aspect-video grid place-items-center">
            {file.type === "image" && (file.fileUrl || file.thumbnail) ? (
              <img src={file.fileUrl || file.thumbnail} alt={file.name} className="h-full w-full object-contain" />
            ) : file.type === "video" && file.fileUrl ? (
              <video controls src={file.fileUrl} className="h-full w-full object-contain" />
            ) : (file?.mimeType?.includes("application/pdf") || ext === "PDF") && file.fileUrl ? (
              <iframe title="PDF preview" src={file.fileUrl} className="h-full w-full" />
            ) : (file?.mimeType?.startsWith("audio/") && file.fileUrl) ? (
              <audio controls src={file.fileUrl} className="w-full" />
            ) : (
              <div className="text-blue-600/80 flex flex-col items-center gap-2">
                {fileIcon(file.type)}
                <span className="text-xs text-gray-500">No preview available</span>
              </div>
            )}
            <div className="absolute left-3 top-3 badge">{ext}</div>
          </div>

          <div className="p-4 sm:p-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate font-semibold text-lg text-gray-100">{file.name}</h1>
              {file.createdAt && (
                <p className="mt-1 text-xs text-gray-400">Uploaded: {new Date(file.createdAt).toLocaleString()}</p>
              )}
              {file.isPublic && file.fileUrl && (
                <p className="mt-1 text-xs text-green-400">Public</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onDownload} className="rounded-lg p-2 hover:bg-gray-800" title="Download"><HiOutlineArrowDownTray className="h-5 w-5 text-gray-300" /></button>
              <button onClick={onShare} className="rounded-lg p-2 hover:bg-gray-800" title="Share"><HiOutlineShare className="h-5 w-5 text-gray-300" /></button>
              <button onClick={onDelete} className="rounded-lg p-2 hover:bg-gray-800" title="Delete"><HiOutlineTrash className="h-5 w-5 text-red-500" /></button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
