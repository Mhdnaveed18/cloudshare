import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { HiOutlineArrowDownTray, HiOutlineShare, HiOutlineTrash, HiOutlineDocument, HiOutlinePhoto, HiOutlineFilm, HiOutlineEye, HiOutlineStar, HiStar } from "react-icons/hi2";
import filesApi from "../api/files";
import ShareModal from "./ShareModal";

function fileIcon(type = "doc") {
  const map = {
    image: <HiOutlinePhoto className="h-6 w-6" />,
    video: <HiOutlineFilm className="h-6 w-6" />,
    doc: <HiOutlineDocument className="h-6 w-6" />,
  };
  return map[type] ?? map.doc;
}

export default function FileCard({ file, onDeleted, canDelete = true }) {
  const { id, name, size, date, type, thumbnail } = file;
  const [shareOpen, setShareOpen] = useState(false);
  const ext = name.split('.').pop()?.toUpperCase() || '';

  // Favorite flag (UI-only if backend not present)
  const initialFav = !!(file?.isFavorite ?? file?.favorite ?? file?._favorite ?? false);
  const [isFavorite, setIsFavorite] = useState(initialFav);
  async function toggleFavorite() {
    // Optimistic update
    const prev = isFavorite;
    const next = !prev;
    setIsFavorite(next);
    try {
      if (!id) throw new Error("Missing file id");
      const res = await filesApi.setFavorite(id, next);
      const ok = (res?.success ?? true);
      if (!ok) throw new Error(res?.message || "Failed to update favorite");
      toast.dismiss();
      toast.success(next ? "Added to favorites" : "Removed from favorites");
    } catch (e) {
      setIsFavorite(prev);
      toast.error(e?.response?.data?.message || e?.message || "Favorite update failed");
    }
  }

  // Derive sharing info if present
  const sharedInfo = useMemo(() => {
    const s = file?._shared;
    if (!s) return null;
    function pickName(obj) {
      if (!obj) return null;
      return obj.name || obj.fullName || obj.username || obj.email || obj.address || null;
    }
    const owner = pickName(s.owner) || s.ownerName || s.ownerEmail || s.from || s.fromEmail || s.sharedByEmail || s.sharedBy || null;
    const recipient = pickName(s.recipient) || pickName(s.to) || s.toEmail || s.sharedWithEmail || s.recipientEmail || s.to || null;
    const when = s.sharedOn || s.createdAt || s.updatedAt || s.date || null;
    return { owner, recipient, when };
  }, [file]);

  async function onDownload() {
    try {
      const resp = await filesApi.downloadUrl(id);
      const url = resp?.data?.downloadUrl ?? resp?.downloadUrl ?? resp?.url;
      if (url) {
        window.open(url, "_blank", "noopener");
      } else {
        toast.error("Download URL not available");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to get download URL");
    }
  }

  async function onShare() {
      // Open modal UI instead of prompt
      setShareOpen(true);
    }

  async function onDelete() {
    if (!id) return;
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await filesApi.delete(id);
      toast.success("Deleted");
      onDeleted?.(id);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Delete failed");
    }
  }

  const card = (
    <div className="card group overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
        {thumbnail ? (
          <Link to={id ? `/file/${id}` : "#"}>
            <img src={thumbnail} alt={name} className="h-full w-full object-cover" />
          </Link>
        ) : (
          <Link to={id ? `/file/${id}` : "#"} className="absolute inset-0 grid place-items-center text-blue-600/80">{fileIcon(type)}</Link>
        )}
        <div className="absolute left-3 top-3 badge">{ext}</div>
        {/* Favorite toggle */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(); }}
          className="absolute right-3 top-3 rounded-full p-1.5 bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 shadow-sm"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          title={isFavorite ? "Unfavorite" : "Favorite"}
        >
          {isFavorite ? (
            <HiStar className="h-5 w-5 text-yellow-400" />
          ) : (
            <HiOutlineStar className="h-5 w-5 text-gray-500 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Meta */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={id ? `/file/${id}` : "#"} className="truncate font-semibold text-gray-900 dark:text-gray-100 hover:underline">{name}</Link>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{size} • {date}</p>
            {sharedInfo && (
              <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 truncate">
                <span className="inline-flex items-center gap-1">
                  <span className="font-medium text-gray-300">{sharedInfo.owner || "Owner"}</span>
                  <span className="opacity-60">→</span>
                  <span className="font-medium text-gray-300">{sharedInfo.recipient || "Recipient"}</span>
                </span>
                <span className="mx-1 opacity-60">•</span>
                <span>
                  {sharedInfo.when ? new Date(sharedInfo.when).toLocaleString() : "Shared"}
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100">
            <Link to={id ? `/file/${id}` : "#"} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" title="Preview"><HiOutlineEye className="h-5 w-5 text-gray-700 dark:text-gray-300" /></Link>
            <button onClick={onDownload} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" title="Download"><HiOutlineArrowDownTray className="h-5 w-5 text-gray-700 dark:text-gray-300" /></button>
            <button onClick={onShare} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" title="Share"><HiOutlineShare className="h-5 w-5 text-gray-700 dark:text-gray-300" /></button>
            {canDelete && (
              <button onClick={onDelete} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" title="Delete"><HiOutlineTrash className="h-5 w-5 text-red-600" /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {card}
      <ShareModal
        fileId={id}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onShared={() => setShareOpen(false)}
      />
    </>
  );
}
