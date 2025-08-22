import { useEffect, useRef, useState } from "react";
import { HiOutlineXMark, HiOutlinePaperAirplane } from "react-icons/hi2";
import { toast } from "react-toastify";
import filesApi from "../api/files";
import userApi from "../api/user";

export default function ShareModal({ fileId, open, onClose, onShared }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    async function loadSuggestions() {
      setSuggestionsLoading(true);
      setSuggestionsError("");
      try {
        const list = await userApi.listEmails(10);
        setSuggestions(list);
      } catch (err) {
        setSuggestionsError(err?.response?.data?.message || err?.message || "Failed to load users");
      } finally {
        setSuggestionsLoading(false);
      }
    }

    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      loadSuggestions();
    } else {
      setEmail("");
      setLoading(false);
      setSuggestions([]);
      setSuggestionsError("");
    }
  }, [open]);

  async function handleSubmit(e) {
    e?.preventDefault?.();
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      setLoading(true);
      const res = await filesApi.share(fileId, trimmed);
      const msg = res?.message || "File shared successfully";
      toast.success(msg);
      onShared?.(trimmed, res);
      onClose?.();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to share file";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => !loading && onClose?.()} />
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-900 text-neutral-100 shadow-xl ring-1 ring-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold">Share file</h3>
          <button className="rounded-lg p-1 hover:bg-white/5" onClick={() => onClose?.()} disabled={loading}>
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <label className="block text-sm font-medium text-gray  -300">Recipient email</label>
          <input
            ref={inputRef}
            type="email"
            placeholder="name@example.com"
            className="w-full rounded-xl border border-gray-700 bg-gray-800/80 text-gray-200 placeholder:text-gray-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          {/* Suggestions from /api/user/emails */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Suggested recipients</p>
            <div className="max-h-56 overflow-auto rounded-xl border border-white/10">
              {suggestionsLoading && (
                <div className="p-3 text-sm text-gray-400">Loading...</div>
              )}
              {!suggestionsLoading && suggestionsError && (
                <div className="p-3 text-sm text-red-400">{suggestionsError}</div>
              )}
              {!suggestionsLoading && !suggestionsError && suggestions.length === 0 && (
                <div className="p-3 text-sm text-gray-400">No users found</div>
              )}
              {!suggestionsLoading && !suggestionsError && suggestions.length > 0 && (
                <ul className="divide-y divide-white/5">
                  {suggestions.map((u, idx) => (
                    <li key={`${u.email}-${idx}`} className="flex items-center gap-3 p-2 hover:bg-white/5 cursor-pointer"
                        onClick={() => setEmail(u.email)}
                        onDoubleClick={(e) => { setEmail(u.email); setTimeout(() => handleSubmit(e), 0); }}
                        title={`Use ${u.email}`}>
                      {u.profileImageUrl ? (
                        <img src={u.profileImageUrl} alt={u.name || u.email} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-700 grid place-items-center text-xs text-gray-300">
                          {(u.name || u.email || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm truncate">{u.name || u.email}</div>
                        {u.name && <div className="text-[11px] text-gray-400 truncate">{u.email}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-[11px] text-gray-500">Tip: click to fill the email, or double‑click to share immediately.</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={() => onClose?.()} disabled={loading} className="px-3 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-gradient text-sm px-4 py-2 inline-flex items-center gap-2">
              <HiOutlinePaperAirplane className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
              {loading ? "Sharing..." : "Share"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
