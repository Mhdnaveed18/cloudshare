import axios from "axios";

// Base Axios client. You can override baseURL with Vite env: VITE_API_BASE_URL
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically if present in localStorage under 'auth.token'
apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore parsing errors
  }
  return config;
});

export default apiClient;
