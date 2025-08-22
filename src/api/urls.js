// Central place to manage API base and endpoints
// Set the base in your .env as: VITE_API_BASE_URL=https://your.api
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cloudsharebackend-production.up.railway.app";
// Optional dedicated upload base (e.g., different domain/CDN or direct storage presigned endpoint prefix)
export const UPLOAD_BASE = import.meta.env.VITE_API_BASE_URL || API_BASE;

export const API_URLS = {
  auth: {
    login: `${API_BASE}/api/auth/login`,
    register: `${API_BASE}/api/auth/register`,
    // Email verification endpoints (per backend):
    // - Send code: POST /api/auth/verify/send { email }
    // - Verify: POST /api/auth/verify { email, verificationCode }
    // - Status: GET /api/auth/verify/status -> { verified: boolean }
    verifySend: `${API_BASE}/api/auth/verify/send`,
    verify: `${API_BASE}/api/auth/verify`,
    verifyStatus: (email) => `${API_BASE}/api/auth/verify/status?email=${email}`,
    forgotPassword: `${API_BASE}/api/auth/forgot-password`,
    resetPassword: `${API_BASE}/api/auth/reset-password`,
    me: `${API_BASE}/api/auth/me`,
    logout: `${API_BASE}/api/auth/logout`,
  },
  files: {
    // Use UPLOAD_BASE specifically for file uploads
    upload: `${UPLOAD_BASE}/api/files/upload`,
    list: (visibility) => visibility ? `${API_BASE}/api/files?visibility=${visibility}` : `${API_BASE}/api/files`,
    changeVisibility: (id) => `${API_BASE}/api/files/${id}/visibility`,
    delete: (id) => `${API_BASE}/api/files/${id}`,
    view: (id) => `${API_BASE}/api/files/${id}/view`,
    downloadUrl: (id) => `${API_BASE}/api/files/${id}/download-url`,
    listByUser: (userId) => `${API_BASE}/api/files/user/${userId}`,
    quota: `${API_BASE}/api/files/quota`,
    share: (id) => `${API_BASE}/api/files/${id}/share`,
    sharedWithMe: `${API_BASE}/api/files/shared/with-me`,
    sharedByMe: `${API_BASE}/api/files/shared/by-me`,
    favorites: `${API_BASE}/api/files/favorites`,
    setFavorite: (id, value) => `${API_BASE}/api/files/${id}/favorite?value=${encodeURIComponent(value)}`,
  },
  user: {
    me: `${API_BASE}/api/user/me`,
    emails: (limit = 10) => `${API_BASE}/api/user/emails?limit=${encodeURIComponent(limit)}`,
    uploadPhoto: `${API_BASE}/api/user/profile/photo`,
    deleteSelf: `${API_BASE}/api/user/delete`,
  },
  billing: {
    createOrder: `${API_BASE}/api/billing/payment/order`,
    verifyPayment: `${API_BASE}/api/billing/payment/verify`,
    status: `${API_BASE}/api/billing/status`,
  },
};

export default API_URLS;
