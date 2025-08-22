import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import authApi from "../api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setResetToken] = useState("");


  async function onSubmit(e) {
    e?.preventDefault?.();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const resp = await authApi.forgotPassword({ email });
      // Expect standardized envelope per backend example
      const ok = resp?.success ?? true; // default to true if backend doesn't provide
      const msg = resp?.message || "If the email exists, a reset token has been generated.";
      const token = resp?.data?.resetToken || resp?.resetToken || resp?.data?.token || "";
      setResetToken(token);
      toast[ok ? "success" : "error"](msg);

      // If we got a token, copy the reset link to clipboard and inform the user
      if (token && navigator?.clipboard?.writeText) {
        try {
          const appBase = window.location.origin;
          const linkFromToken = `${appBase}/reset-password?token=${encodeURIComponent(token)}`;
          await navigator.clipboard.writeText(linkFromToken);
          toast.info("Reset link copied to clipboard");
        } catch {
          // Ignore clipboard errors
        }
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to send reset link";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Enter your email and we'll send you a reset link.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button type="submit" className="btn-gradient w-full py-2.5 disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>


        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Back to <Link to="/login" className="font-medium text-blue-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
