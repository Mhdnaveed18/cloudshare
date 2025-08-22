import apiClient from "./client";
import { API_URLS } from "./urls";

export const userApi = {
  /**
   * Fetch current user details.
   * GET /api/user/me -> envelope: { success, message, data: { id, email, firstName, lastName, role, profileImageUrl, emailVerified }, ... }
   */
  async me() {
    const { data } = await apiClient.get(API_URLS.user.me);
    const payload = data?.data ?? data ?? {};
    const firstName = payload.firstName || payload.firstname || payload.givenName || '';
    const lastName = payload.lastName || payload.lastname || payload.surname || '';
    const name = payload.name || [firstName, lastName].filter(Boolean).join(' ').trim();
    return {
      raw: data,
      user: {
        id: payload.id ?? payload.userId ?? payload.uid ?? null,
        email: payload.email ?? null,
        firstName,
        lastName,
        name,
        role: payload.role ?? payload.userRole ?? null,
        profileImageUrl: payload.profileImageUrl || payload.avatarUrl || payload.photoUrl || null,
        emailVerified: Boolean(payload.emailVerified ?? payload.verified ?? false),
        isPremium: Boolean(payload.isPremium ?? payload.premium ?? false),
      },
    };
  },

  /**
   * Uploads (updates) the current user's profile photo.
   * Expects backend endpoint: POST /api/user/profile/photo
   * Body: multipart/form-data with field name "photo" (fallbacks: "file", "image")
   * Returns: envelope containing the new photo URL or updated user object.
   */
  async uploadProfilePhoto(file, { onProgress } = {}) {
    const form = new FormData();
    // Use primary field name "photo"; include alternates for compatibility
    form.append("photo", file);
    if (!form.has("file")) form.append("file", file);
    if (!form.has("image")) form.append("image", file);

    const { data } = await apiClient.post(API_URLS.user.uploadPhoto, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (!evt || !onProgress) return;
        const total = evt.total || evt.currentTarget?.getResponseHeader?.("content-length") || 0;
        const loaded = evt.loaded || 0;
        if (total > 0) onProgress(Math.round((loaded / total) * 100));
      },
    });

    // Normalize response: try to extract photo URL and/or user
    const payload = data?.data ?? data ?? {};
    // Consider all possible backend keys, including profileImageUrl
    const photoUrl = payload.photoUrl || payload.avatarUrl || payload.profileImageUrl || payload.url || payload.imageUrl || payload.profilePhotoUrl || payload.user?.photoUrl || payload.user?.avatarUrl || payload.user?.profileImageUrl || null;
    const user = payload.user || null;
    return { photoUrl, user, raw: data };
  },

  /**
   * Delete the currently authenticated user (and associated files, per backend contract).
   * DELETE /api/user/delete
   */
  async deleteSelf() {
    const { data } = await apiClient.delete(API_URLS.user.deleteSelf);
    return data?.data ?? data ?? { success: true };
  },
  /**
   * List user emails for sharing suggestions.
   * GET /api/user/emails?limit=10 -> envelope: { data: Array<{ email, name?, profileImageUrl? }> }
   */
  async listEmails(limit = 10) {
    const { data } = await apiClient.get(API_URLS.user.emails(limit));
    const list = data?.data ?? data ?? [];
    // Normalize entries into a consistent shape
    return list.map((u) => ({
      email: u.email || u.userEmail || u.username || "",
      name: u.name || u.fullName || [u.firstName || u.firstname, u.lastName || u.lastname].filter(Boolean).join(" ").trim() || null,
      profileImageUrl: u.profileImageUrl || u.avatarUrl || u.photoUrl || null,
      id: u.id || u.userId || null,
    })).filter((u) => u.email);
  },
};

export default userApi;
