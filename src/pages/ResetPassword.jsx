import { useMemo, useState, useEffect } from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import authApi from "../api/auth";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPassword() {
  const { token: tokenParam } = useParams();
  const location = useLocation();
  const query = useQuery();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Prefer path param, then query ?token=, then hash fragment like #token=...
    const qToken = query.get("token") || "";
    const hashToken = (() => {
      try {
        const h = location.hash || "";
        if (!h) return "";
        // Support formats like #token=abc or #/reset-password?token=abc
        const fromDirect = h.startsWith("#token=") ? h.slice(7) : "";
        if (fromDirect) return decodeURIComponent(fromDirect);
        const idx = h.indexOf("token=");
        if (idx >= 0) {
          const part = h.slice(idx + 6);
          const end = part.indexOf("&");
          return decodeURIComponent(end >= 0 ? part.slice(0, end) : part);
        }
        return "";
      } catch {
        return "";
      }
    })();
    const finalToken = tokenParam || qToken || hashToken || "";
    if (finalToken) setToken(finalToken);
  }, [tokenParam, query, location.hash]);

  async function onSubmit(e) {
    e?.preventDefault?.();
    if (!token) {
      toast.error("Reset token is missing");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const resp = await authApi.resetPassword({ token, newPassword: password });
      const msg = resp?.message || resp?.data?.message || "Password reset successful";
      toast.success(msg);
      navigate("/login");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to reset password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Set a new password</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Enter your new password below. The token is prefilled from your link.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter a strong password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Re-enter new password"
            />
          </div>
          <button type="submit" className="btn-gradient w-full py-2.5 disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Back to <Link to="/login" className="font-medium text-blue-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
