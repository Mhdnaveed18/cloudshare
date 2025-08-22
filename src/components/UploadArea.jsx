import { useCallback, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HiOutlineCloudArrowUp } from "react-icons/hi2";
import ProgressBar from "./ProgressBar";
import { filesApi } from "../api/files";

export default function UploadArea({ onUploadComplete }) {
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s) => s.auth || { user: null, isAuthenticated: false });
  const mustVerify = Boolean(isAuthenticated && user && user.email && (user.emailVerified === false));
  const [isOver, setIsOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    setProgress(0);
    try {
      // Upload sequentially to keep simple global progress (0-100 across all files)
      const list = Array.from(files);
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        await filesApi.upload(file, {
          onProgress: (p) => {
            // Convert per-file progress to overall progress
            const perFileWeight = 100 / list.length;
            const completedWeight = perFileWeight * i;
            setProgress(Math.min(100, Math.round(completedWeight + (p * perFileWeight) / 100)));
          },
        });
      }
      setProgress(100);
      onUploadComplete?.(Array.from(files));
    } catch (e) {
      const message = e?.response?.data?.message || e?.message || "Upload failed";
      setError(message);
    } finally {
      setUploading(false);
      // reset input so selecting same file again triggers change
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [onUploadComplete]);

  const onDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    if (mustVerify) {
      setError("Please verify your email to upload files.");
      return;
    }
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      className={`card relative border border-dashed ${isOver ? "border-blue-400 bg-blue-50/50" : "border-gray-200"} p-8 text-center transition`}
    >
      <div className="mx-auto grid max-w-xl place-items-center gap-4">
        <div className={`grid h-16 w-16 place-items-center rounded-2xl transition shadow-sm ${isOver ? "bg-gradient-to-br from-[--color-brand] to-[--color-brand-2] text-white shadow-blue-500/30" : "bg-blue-50 text-blue-600"}`}>
          <HiOutlineCloudArrowUp className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Drag & drop your files</h3>
          <p className="text-sm text-gray-600">or click to browse from your device</p>
        </div>
        <button
          type="button"
          className="btn-gradient"
          onClick={() => {
            if (mustVerify) {
              setError("Please verify your email to upload files.");
              navigate("/verify-email");
              return;
            }
            inputRef.current?.click();
          }}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload files"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={mustVerify}
        />
        {uploading && (
          <div className="w-full space-y-2">
            <ProgressBar value={progress} />
            <div className="text-xs text-gray-500">{progress}%</div>
          </div>
        )}
        {!uploading && error && (
          <div className="w-full text-xs text-red-500">{error}</div>
        )}
        {!uploading && mustVerify && (
          <div className="w-full text-xs text-yellow-300">
            Email verification required to upload. You can verify your email from Settings or the Verify Email page.
          </div>
        )}
      </div>
      <div className={`pointer-events-none absolute inset-0 rounded-2xl ring-1 transition ${isOver ? "ring-blue-500/30" : "ring-transparent"}`} />
    </div>
  );
}
