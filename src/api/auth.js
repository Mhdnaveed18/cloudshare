import apiClient from "./client";
import { API_URLS } from "./urls";

// Auth API wrapper. Replace endpoints with your backend ones.
export const authApi = {
  // Example: POST /auth/login { email, password }
  async login({ email, password }) {
    // If you don't have backend yet, this simulates success for any non-empty credentials
    const effectiveBase = import.meta.env.VITE_API_BASE_URL || "https://cloudsharebackend.railway.internal";
    if (effectiveBase === "https://api.example.com") {
      await new Promise((r) => setTimeout(r, 600));
      if (!email || !password) throw new Error("Email and password are required");
      return {
        token: "demo-token-123",
        user: { id: "u_demo", name: email.split("@")[0] || "User", email },
      };
    }

    const { data } = await apiClient.post(API_URLS.auth.login, { email, password });
    // Backend returns EntityResponse envelope; extract accessToken
    const token = data?.data?.accessToken || data?.accessToken || data?.token || null;
    const rawUser = data?.data?.user || data?.user || { email, name: email?.split("@")[0] };
    const user = {
      ...rawUser,
      emailVerified: Boolean(rawUser?.emailVerified ?? rawUser?.verified ?? false),
    };
    if (!token) {
      // throw to let caller show message; prefer backend message field
      const message = data?.message || "Login failed";
      const e = new Error(message);
      e.response = { data };
      throw e;
    }
    return { token, user };
  },

  async register({ email, password, firstName, lastName }) {
    const { data } = await apiClient.post(API_URLS.auth.register, { email, password, firstName, lastName });
    // Expect envelope with data.accessToken
    const token = data?.data?.accessToken || null;
    return { token };
  },

  async verifyEmail({ email, verificationCode }) {
    const { data } = await apiClient.post(API_URLS.auth.verify, { email, verificationCode });
    return data; // envelope with message
  },

  async sendVerificationCode({ email }) {
    const { data } = await apiClient.post(API_URLS.auth.verifySend, { email });
    return data; // envelope with message
  },

  async forgotPassword({ email }) {
    const { data } = await apiClient.post(API_URLS.auth.forgotPassword, { email });
    return data; // envelope with data.message and maybe resetToken
  },

  async resetPassword({ token, newPassword }) {
    const { data } = await apiClient.post(API_URLS.auth.resetPassword, { token, newPassword });
    return data; // envelope with message
  },

  async me() {
    const { data } = await apiClient.get(API_URLS.auth.me);
    return data; // envelope with user or message
  },

  async verifyStatus() {
    const { data } = await apiClient.get(API_URLS.auth.verifyStatus);
    return data; // envelope with verified flag
  },

  async logout() {
    try {
      await apiClient.post(API_URLS.auth.logout);
    } catch {
      // ignore
    }
    return { ok: true };
  },
};

export default authApi;
