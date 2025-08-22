import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import FileView from "./pages/FileView";
import Files from "./pages/Files";
import Settings from "./pages/Settings";
import Shared from "./pages/Shared";
import ResetPassword from "./pages/ResetPassword";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { loginSuccess } from "./store/authSlice";
import { userApi } from "./api/user";
import authApi from "./api/auth";
import billingApi from "./api/billing";

function AppBootstrap() {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!isAuthenticated || !token) return;
      try {
        const [meRes, verRes, billRes] = await Promise.allSettled([
          userApi.me(),
          authApi.verifyStatus(),
          billingApi.status().catch(() => null),
        ]);

        let nextUser = { ...(user || {}) };

        if (meRes.status === "fulfilled" && meRes.value?.user) {
          nextUser = { ...nextUser, ...meRes.value.user };
        }

        if (verRes.status === "fulfilled") {
          const d = verRes.value?.data ?? verRes.value;
          const v = d?.data?.verified ?? d?.verified ?? d?.data?.isVerified ?? d?.isVerified ?? d?.emailVerified ?? d?.data?.emailVerified;
          const isVerified = typeof v === "boolean" ? v : (typeof d?.status === "string" ? d.status.toLowerCase() === "verified" : Boolean(v));
          if (isVerified) nextUser.emailVerified = true;
        }

        if (billRes && billRes.status === "fulfilled") {
          const d = billRes.value?.data ?? billRes.value;
          const isPremium = Boolean(d?.data?.isPremium ?? d?.isPremium ?? (typeof d?.status === "string" && d.status.toLowerCase() === "premium"));
          if (isPremium) nextUser.isPremium = true;
        }

        if (!cancelled) {
          dispatch(loginSuccess({ token, user: nextUser }));
        }
      } catch {
        // ignore bootstrap failures
      }
    }
    bootstrap();
    return () => { cancelled = true; };
  }, [dispatch, isAuthenticated, token]);
  return null;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <AppBootstrap />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/file/:id" element={<FileView />} />
        <Route path="/files" element={<Files />} />
        <Route path="/favorites" element={<Files />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/shared" element={<Shared />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
}
