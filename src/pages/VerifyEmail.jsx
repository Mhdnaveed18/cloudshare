import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import authApi from "../api/auth";
import { loginSuccess } from "../store/authSlice";

export default function VerifyEmail() {
  const { user, token } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [email, setEmail] = useState(user?.email || "");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [searchParams] = useSearchParams();
  const didAuto = useRef(false);

  function isAlreadyVerifiedMessage(msg) {
    return typeof msg === "string" && msg.toLowerCase().includes("already verifi");
  }

  async function onSendCode() {
    const effectiveEmail = user?.email || email;
    if (!effectiveEmail) {
      toast.error("Please enter your email first");
      return;
    }
    setSending(true);
    try {
      await authApi.sendVerificationCode({ email: effectiveEmail });
      toast.success("A verification code has been sent to your email");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to send code";
      if (isAlreadyVerifiedMessage(msg)) {
        toast.info("Email is already verified");
      } else {
        toast.error(msg);
      }
    } finally {
      setSending(false);
    }
  }

  async function onVerify() {
    const effectiveEmail = user?.email || email;
    if (!effectiveEmail || !code) {
      toast.error("Enter email and verification code");
      return;
    }
    setVerifying(true);
    try {
      await authApi.verifyEmail({ email: effectiveEmail, verificationCode: code });
      toast.success("Verified");
      if (user) {
        dispatch(loginSuccess({ token, user: { ...user, emailVerified: true } }));
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Verification failed";
      if (isAlreadyVerifiedMessage(msg)) {
        toast.info("Email is already verified");
        if (user && !user?.emailVerified) {
          dispatch(loginSuccess({ token, user: { ...user, emailVerified: true } }));
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setVerifying(false);
    }
  }

  const emailReadonly = Boolean(user?.email);

  useEffect(() => {
    if (didAuto.current) return;
    const qpEmail = (searchParams.get("email") || "").trim();
    const qpCode = (searchParams.get("code") || searchParams.get("token") || searchParams.get("otp") || "").trim();
    const auto = (searchParams.get("auto") || "").trim();

    // Prefill email from query if user email not known
    if (qpEmail && !user?.email) {
      setEmail(qpEmail);
    }

    async function runAuto() {
      try {
        // Auto-verify if code present and we have an email
        const effectiveEmail = user?.email || qpEmail || email;
        if (effectiveEmail && qpCode) {
          didAuto.current = true;
          setVerifying(true);
          try {
            await authApi.verifyEmail({ email: effectiveEmail, verificationCode: qpCode });
            toast.success("Verified via link");
            if (user) {
              dispatch(loginSuccess({ token, user: { ...user, emailVerified: true } }));
            }
          } catch (e) {
            const msg = e?.response?.data?.message || e?.message || "Verification failed";
            if (isAlreadyVerifiedMessage(msg)) {
              toast.info("Email is already verified");
              if (user && !user?.emailVerified) {
                dispatch(loginSuccess({ token, user: { ...user, emailVerified: true } }));
              }
            } else {
              toast.error(msg);
            }
          } finally {
            setVerifying(false);
          }
          return;
        }

        // Otherwise, auto-send code if requested
        if (effectiveEmail && auto === "1") {
          didAuto.current = true;
          setSending(true);
          try {
            await authApi.sendVerificationCode({ email: effectiveEmail });
            toast.success("Verification code sent to your email");
          } catch (e) {
            const msg = e?.response?.data?.message || e?.message || "Failed to send code";
            if (isAlreadyVerifiedMessage(msg)) {
              toast.info("Email is already verified");
              if (user && !user?.emailVerified) {
                dispatch(loginSuccess({ token, user: { ...user, emailVerified: true } }));
              }
            } else {
              toast.error(msg);
            }
          } finally {
            setSending(false);
          }
        }
      } catch {
        // ignore
      }
    }

    runAuto();
  }, [searchParams, user, token]);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Verify your email</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Check your inbox for the code. If you don't have one, send a new code.</p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <div className="mt-1 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => !emailReadonly && setEmail(e.target.value)}
                readOnly={emailReadonly}
                disabled={emailReadonly}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70"
              />
              <button type="button" onClick={onSendCode} disabled={sending} className="btn-gradient whitespace-nowrap px-4 disabled:opacity-60 disabled:cursor-not-allowed">
                {sending ? "Sending..." : "Send code"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Verification code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button type="button" onClick={onVerify} disabled={verifying} className="btn-gradient w-full py-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
            {verifying ? "Verifying..." : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}
