import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { toast } from "react-toastify";
import authApi from "../api/auth";
import { loginSuccess, logout } from "../store/authSlice";
import apiClient from "../api/client";
import { API_URLS } from "../api/urls";
import { userApi } from "../api/user";
import filesApi from "../api/files";
import billingApi from "../api/billing";

// Dynamically load Razorpay checkout script
async function loadRazorpayScript() {
  const src = "https://checkout.razorpay.com/v1/checkout.js";
  if (document.querySelector(`script[src="${src}"]`)) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatINR(paise, currency = "INR") {
  const amount = Number(paise || 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function normalizeAmountToPaise(amount, currency = "INR") {
  const n = Math.round(Number(amount || 0));
  if (!isFinite(n) || n <= 0) return 0;
  // If backend sent rupees (e.g., 500) but Razorpay expects paise (50000)
  // Heuristic: if INR and amount is less than 1000, treat as rupees and convert to paise
  if ((currency || "INR").toUpperCase() === "INR" && n < 1000) return n * 100;
  return n; // assume already paise
}

function PurchasePremiumSection({ billing, setBilling, onUpgraded }) {
  const dispatch = useDispatch();
  const { user, token } = useSelector((s) => s.auth);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [order, setOrder] = useState(null);

  async function startCheckout() {
    try {
      setCreating(true);
      // Ask backend to create order for premium plan (user from JWT)
      const ord = await billingApi.createOrder({ plan: "premium" });
      if (!ord?.orderId) {
        toast.error("Failed to create order");
        setCreating(false);
        return;
      }
      // Normalize amount to paise for both display and checkout to avoid Rs 5 instead of Rs 500 mistakes
      const normalizedAmount = normalizeAmountToPaise(ord.amount, ord.currency);
      const normalizedOrder = { ...ord, amount: normalizedAmount };
      setOrder(normalizedOrder);
      toast.info(`Order created: ${ord.orderId}`);

      // Show price summary and then open Razorpay
      const ok = await loadRazorpayScript();
      if (!ok) {
        toast.error("Failed to load Razorpay");
        setCreating(false);
        return;
      }

      if (!ord.key) {
        toast.error("Razorpay key missing. Configure backend or VITE_RAZORPAY_KEY_ID");
        setCreating(false);
        return;
      }

      setPaying(true);
      const options = {
        key: ord.key,
        amount: normalizeAmountToPaise(ord.amount, ord.currency),
        currency: ord.currency || "INR",
        name: ord.name || "CloudShare Premium",
        description: ord.description || "Premium subscription",
        order_id: ord.orderId,
        prefill: {
          name: user?.name || user?.firstName || "",
          email: user?.email || "",
        },
        notes: ord.notes || {},
        // Use legacy/previous handler pattern for reliability
        handler: async function (response) {
          try {
            const verification = await billingApi.verifyPayment({
              orderId: response.razorpay_order_id || ord.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            const msg = verification?.message || "Payment verified. Quota upgraded.";
            toast.success(msg);
            setBilling((b) => ({ ...b, isPremium: true }));
            if (user) {
              // update redux immediately so UI (e.g., navbar) reflects premium without refresh
              dispatch(loginSuccess({ token, user: { ...user, isPremium: true } }));
            }
            // Trigger parent refresh hook if provided
            onUpgraded?.();
          } catch (e) {
            toast.error(e?.response?.data?.message || e?.message || "Verification failed");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            // Ensure paying state resets if user closes the modal manually
            setPaying(false);
          },
          backdropclose: true,
          escape: true,
          handleback: true,
        },
        theme: { color: "#3b82f6" },
      };

      const rz = new window.Razorpay(options);

      // Fallback failure handler to prevent stuck modal
      rz.on && rz.on("payment.failed", function (response) {
        toast.error(response?.error?.description || "Payment failed. Please try again.");
        setPaying(false);
        try { rz.close(); } catch (err) { void err; }
      });

      rz.open();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to start checkout");
    } finally {
      setCreating(false);
    }
  }

  if (billing.isPremium) {
    return (
      <div className="mt-4 rounded-lg border border-green-800/40 bg-green-900/20 p-4 text-sm">
        <p className="text-green-300">You are on Premium. Enjoy higher quotas and priority features.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-blue-800/40 bg-blue-900/10 p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium text-gray-100">Upgrade to Premium</div>
          {order ? (
            <div className="mt-1 text-gray-300">
              <div>Order ID: <span className="font-mono">{order.orderId}</span></div>
              <div>Price: <span className="font-semibold">{formatINR(order.amount, order.currency)}</span></div>
            </div>
          ) : (
            <div className="mt-1 text-gray-300">Need to buy premium</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={startCheckout} disabled={creating || paying} className="btn-gradient px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
            {creating ? "Creating order..." : paying ? "Opening checkout..." : order ? "Pay now" : "Buy Premium"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);
  const [billing, setBilling] = useState({ loading: false, isPremium: Boolean(user?.isPremium || user?.premium || user?.plan === "premium"), details: null });
  const [quota, setQuota] = useState({ loading: true, used: 0, limit: null, error: null });
  const [verif, setVerif] = useState({ email: user?.email || "", code: "", loading: false, sending: false });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [verifyStatus, setVerifyStatus] = useState({ loading: true, isVerified: Boolean(user?.emailVerified) });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Fetch current user details from /api/user/me and update store/UI
    (async () => {
      try {
        const { user: fetchedUser } = await userApi.me();
        if (fetchedUser) {
          dispatch(loginSuccess({ token, user: { ...user, ...fetchedUser } }));
          // Use email from fetched user for verification form
          setVerif((v) => ({ ...v, email: fetchedUser.email || v.email }));
          // Reflect email verification status from fetched data immediately
          if (typeof fetchedUser.emailVerified === 'boolean') {
            setVerifyStatus({ loading: false, isVerified: fetchedUser.emailVerified });
          }
        }
      } catch {
        // silently ignore; keep existing user state
      }

      // Also check verification status endpoint for absolute truth
      try {
        const resp = await authApi.verifyStatus();
        const d = resp?.data ?? resp;
        const v = d?.data?.verified ?? d?.verified ?? d?.data?.isVerified ?? d?.isVerified ?? d?.emailVerified ?? d?.data?.emailVerified;
        const isVerified = typeof v === "boolean" ? v : (typeof d?.status === "string" ? d.status.toLowerCase() === "verified" : Boolean(v));
        setVerifyStatus({ loading: false, isVerified });
        if (isVerified) {
          dispatch(loginSuccess({ token, user: { ...user, emailVerified: true } }));
        }
      } catch {
        setVerifyStatus((prev) => ({ loading: false, isVerified: Boolean(user?.emailVerified ?? prev.isVerified) }));
      }

      // Fetch quota info (files used and limit)
      try {
        setQuota((q) => ({ ...q, loading: true, error: null }));
        const resp = await filesApi.quota();
        const d = resp?.data ?? resp;
        // Attempt to normalize fields from various possible backend shapes
        const usedRaw = d?.usedFiles ?? d?.filesUsed ?? d?.used ?? d?.count ?? d?.current ?? d?.data?.usedFiles ?? d?.data?.filesUsed;
        const limitRaw = d?.fileLimit ?? d?.maxFiles ?? d?.limit ?? d?.totalFiles ?? d?.data?.fileLimit ?? d?.data?.maxFiles ?? d?.data?.limit;
        const used = Number(usedRaw ?? 0);
        const limit = limitRaw == null ? null : Number(limitRaw);
        setQuota({ loading: false, used: isNaN(used) ? 0 : used, limit: isNaN(limit) ? null : limit, error: null });
      } catch (e) {
        setQuota({ loading: false, used: 0, limit: null, error: e?.response?.data?.message || e?.message || "Failed to fetch quota" });
      }
    })();
  }, [dispatch, token]);

  // Lightweight real-time refresh: when tab regains focus or becomes visible, re-fetch user, verification and billing status
  useEffect(() => {
    let isMounted = true;
    async function refreshAll() {
      try {
        // refresh user details
        try {
          const { user: fetchedUser } = await userApi.me();
          if (!isMounted) return;
          if (fetchedUser) {
            dispatch(loginSuccess({ token, user: { ...user, ...fetchedUser } }));
            if (typeof fetchedUser.emailVerified === 'boolean') {
              setVerifyStatus({ loading: false, isVerified: fetchedUser.emailVerified });
            }
          }
        } catch {
          // ignore
        }
        // refresh verification status
        try {
          const resp = await authApi.verifyStatus();
          const d = resp?.data ?? resp;
          const v = d?.data?.verified ?? d?.verified ?? d?.data?.isVerified ?? d?.isVerified ?? d?.emailVerified ?? d?.data?.emailVerified;
          const isVerified = typeof v === "boolean" ? v : (typeof d?.status === "string" ? d.status.toLowerCase() === "verified" : Boolean(v));
          if (!isMounted) return;
          setVerifyStatus({ loading: false, isVerified });
          if (isVerified) {
            dispatch(loginSuccess({ token, user: { ...user, emailVerified: true } }));
          }
        } catch {
          // ignore
        }
        // refresh billing status (also updates Premium badge)
        try {
          await refreshBilling();
        } catch {
          // ignore
        }
      } catch {
        // noop
      }
    }

    function onFocus() { refreshAll(); }
    function onVisibility() { if (document.visibilityState === 'visible') refreshAll(); }

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [dispatch, token, user]);
  
  function isAlreadyVerifiedMessage(msg) {
    return typeof msg === "string" && msg.toLowerCase().includes("already verifi");
  }

  async function refreshBilling() {
    setBilling((b) => ({ ...b, loading: true }));
    try {
      const { data } = await apiClient.get(API_URLS.billing.status);
      const isPremium = Boolean(data?.data?.isPremium ?? data?.isPremium ?? data?.status === "premium");
      setBilling({ loading: false, isPremium, details: data });
      if (user) {
        dispatch(loginSuccess({ token, user: { ...user, isPremium } }));
      }
    } catch (e) {
      setBilling((b) => ({ ...b, loading: false }));
      toast.error(e?.response?.data?.message || e?.message || "Failed to fetch billing status");
    }
  }

  async function onVerifyEmail(e) {
    e.preventDefault();
    setVerif((v) => ({ ...v, loading: true }));
    try {
      await authApi.verifyEmail({ email: verif.email, verificationCode: verif.code });
      toast.success("Verified");
      if (user) dispatch(loginSuccess({ token, user: { ...user, emailVerified: true } }));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Verification failed";
      if (isAlreadyVerifiedMessage(msg)) {
        toast.info("Email is already verified");
        if (user && !user?.emailVerified) dispatch(loginSuccess({ token, user: { ...user, emailVerified: true } }));
      } else {
        toast.error(msg);
      }
    } finally {
      setVerif((v) => ({ ...v, loading: false }));
    }
  }

  async function onSendCode() {
    if (!verif.email) {
      toast.error("Please enter your email first");
      return;
    }
    setVerif((v) => ({ ...v, sending: true }));
    try {
      await authApi.sendVerificationCode({ email: verif.email });
      toast.success("A verification code has been sent to your email");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to send code";
      if (isAlreadyVerifiedMessage(msg)) {
        toast.info("Email is already verified");
      } else {
        toast.error(msg);
      }
    } finally {
      setVerif((v) => ({ ...v, sending: false }));
    }
  }

  async function onForgotPassword() {
    if (!user?.email) {
      toast.info("Please enter your email below first");
      return;
    }
    setForgotLoading(true);
    try {
      await authApi.forgotPassword({ email: user.email });
      toast.success("Reset link sent (check your email)");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to start reset");
    } finally {
      setForgotLoading(false);
    }
  }

  async function onAvatarChange(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setAvatarUploading(true);
    try {
      const { userApi } = await import("../api/user");
      const resp = await userApi.uploadProfilePhoto(file);
      const rawUrl = resp.photoUrl || resp.user?.profileImageUrl || resp.user?.avatarUrl || resp.user?.photoUrl;
      const cacheBustedUrl = rawUrl ? `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}t=${Date.now()}` : null;
      if (user) {
        const merged = resp.user ? { ...user, ...resp.user } : { ...user };
        const updatedUser = cacheBustedUrl ? { ...merged, profileImageUrl: cacheBustedUrl, avatarUrl: cacheBustedUrl } : merged;
        dispatch(loginSuccess({ token, user: updatedUser }));
      }
      toast.success("Profile photo updated");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to upload profile photo";
      toast.error(msg);
    } finally {
      setAvatarUploading(false);
    }
  }

  const emailReadonly = Boolean(user?.email);

  return (
    <main className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
      <div className="lg:flex lg:items-start lg:gap-8">
        <Sidebar />
        <section className="flex-1 space-y-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Settings</h1>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Account */}
            <div className="card p-6">
              <h2 className="font-semibold text-lg mb-4">Account</h2>
              <div className="flex items-center gap-4">
                <div className="relative group h-16 w-16 rounded-full overflow-hidden bg-gray-800 grid place-items-center">
                  {user?.profileImageUrl || user?.avatarUrl ? (
                    <img src={(user?.profileImageUrl || user?.avatarUrl)} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm text-gray-400">No photo</span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onAvatarChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-300 font-bold">{user?.name || "Unnamed"}</div>
                    {(billing.isPremium || user?.isPremium) ? (
                      <span className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 px-2 py-0.5 text-[10px] font-semibold" title="Premium">⭐ Premium</span>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-500">{user?.email || "No email"}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  className="btn-gradient px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? "Uploading..." : ((user?.profileImageUrl || user?.avatarUrl) ? "Change photo" : "Choose photo")}
                </button>
                <button
                  type="button"
                  className="px-3 py-2 text-sm rounded-xl border border-red-800 bg-red-900/20 text-red-300 hover:bg-red-900/30"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete account
                </button>
              </div>
            </div>

            {/* Billing */}
            <div className="card p-6">
              <h2 className="font-semibold text-lg mb-4">Subscription</h2>
              <p className="text-sm">Status: {billing.isPremium ? <span className="text-green-400 font-medium">Premium</span> : <span className="text-gray-300">Free</span>}</p>
              {!billing.isPremium && (
                <div className="mt-2 text-sm text-gray-300">
                  {quota.loading ? (
                    <p>Files: Loading...</p>
                  ) : quota.error ? (
                    <p>Files: <span className="text-red-400">{quota.error}</span></p>
                  ) : (
                    <p>
                      Files: <span className="font-medium">{quota.used}</span>
                      {quota.limit == null || quota.limit < 0 ? (
                        <> of <span className="font-medium">unlimited</span></>
                      ) : (
                        <>
                          of <span className="font-medium">{quota.limit}</span>
                          {quota.limit > 0 ? (
                            <> (<span className="text-gray-400">{Math.min(100, Math.round((quota.used / quota.limit) * 100))}% used</span>)</>
                          ) : null}
                        </>
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* Purchase Premium CTA */}
              <PurchasePremiumSection billing={billing} setBilling={setBilling} onUpgraded={() => { refreshBilling(); }} />

              {!billing.isPremium && (
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={refreshBilling} className="btn-gradient px-3 py-2 text-sm" disabled={billing.loading}>{billing.loading ? "Checking..." : "Refresh status"}</button>
                  <button onClick={async () => {
                    try {
                      setQuota((q) => ({ ...q, loading: true, error: null }));
                      const resp = await filesApi.quota();
                      const d = resp?.data ?? resp;
                      const usedRaw = d?.usedFiles ?? d?.filesUsed ?? d?.used ?? d?.count ?? d?.current ?? d?.data?.usedFiles ?? d?.data?.filesUsed;
                      const limitRaw = d?.fileLimit ?? d?.maxFiles ?? d?.limit ?? d?.totalFiles ?? d?.data?.fileLimit ?? d?.data?.maxFiles ?? d?.data?.limit;
                      const used = Number(usedRaw ?? 0);
                      const limit = limitRaw == null ? null : Number(limitRaw);
                      setQuota({ loading: false, used: isNaN(used) ? 0 : used, limit: isNaN(limit) ? null : limit, error: null });
                    } catch (e) {
                      setQuota({ loading: false, used: 0, limit: null, error: e?.response?.data?.message || e?.message || "Failed to fetch quota" });
                    }
                  }} className="btn-outline px-3 py-2 text-sm">Refresh quota</button>
                </div>
              )}
            </div>

            {/* Verification */}
            <div className="card p-6">
              <h2 className="font-semibold text-lg mb-4">Verify email</h2>
              {verifyStatus.loading ? (
                <p className="text-sm text-gray-400">Checking verification status...</p>
              ) : verifyStatus.isVerified ? (
                <div className="rounded-lg border border-green-700/40 bg-green-900/20 p-4">
                  <p className="text-sm text-green-400">Your email is verified.</p>
                </div>
              ) : (
                <form onSubmit={onVerifyEmail} className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-300">Email</label>
                    <div className="mt-1 flex gap-2">
                      <input type="email" value={verif.email} readOnly={emailReadonly} disabled={emailReadonly} onChange={(e) => !emailReadonly && setVerif((v) => ({ ...v, email: e.target.value }))} className="flex-1 rounded-xl border border-gray-700 bg-gray-900 text-gray-100 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70" />
                      <button type="button" onClick={onSendCode} disabled={verif.sending} className="btn-gradient whitespace-nowrap px-4 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                        {verif.sending ? "Sending..." : "Send code"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300">Verification code</label>
                    <input type="text" value={verif.code} onChange={(e) => setVerif((v) => ({ ...v, code: e.target.value }))} className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-900 text-gray-100 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <button type="submit" className="btn-gradient px-4 py-2 text-sm" disabled={verif.loading}>{verif.loading ? "Verifying..." : "Verify"}</button>
                </form>
              )}
            </div>

            {/* Password */}
            <div className="card p-6">
              <h2 className="font-semibold text-lg mb-4">Password</h2>
              <p className="text-sm text-gray-400">Send a password reset link to your account email.</p>
              <button onClick={onForgotPassword} className="mt-3 btn-gradient px-3 py-2 text-sm" disabled={forgotLoading}>{forgotLoading ? "Sending..." : "Send reset link"}</button>
            </div>
          </div>
        </section>
      </div>
      {/* Delete Account Warning Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => !deleting && setShowDeleteModal(false)}></div>
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-red-800/40 bg-gray-900 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-red-300">Delete account</h3>
            <p className="mt-2 text-sm text-gray-300">
              This action is permanent. Your account and all files related to your account will be deleted. This cannot be undone.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-xl border border-gray-700 hover:bg-gray-800"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-xl border border-red-800 bg-red-900/30 text-red-200 hover:bg-red-900/40 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={deleting}
                onClick={async () => {
                  try {
                    setDeleting(true);
                    await userApi.deleteSelf();
                    toast.success("Account deleted");
                    dispatch(logout());
                    navigate("/register");
                  } catch (e) {
                    toast.error(e?.response?.data?.message || e?.message || "Failed to delete account");
                  } finally {
                    setDeleting(false);
                    setShowDeleteModal(false);
                  }
                }}
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
