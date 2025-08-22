import apiClient from "./client";
import { API_URLS } from "./urls";

export const filesApi = {
  async upload(file, { onProgress } = {}) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post(API_URLS.files.upload, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (!evt || !onProgress) return;
        const total = evt.total || evt.currentTarget?.getResponseHeader?.("content-length") || 0;
        const loaded = evt.loaded || 0;
        if (total > 0) {
          onProgress(Math.round((loaded / total) * 100));
        }
      },
    });
    return data; // envelope with data: UploadResponse
  },

  async list(visibility) {
    const { data } = await apiClient.get(API_URLS.files.list(visibility));
    return data; // envelope with data: array of FileItem
  },

  async changeVisibility(id, visibility) {
    const { data } = await apiClient.patch(API_URLS.files.changeVisibility(id), { visibility });
    return data; // envelope with data: FileSummaryResponse
  },

  async delete(id) {
    const res = await apiClient.delete(API_URLS.files.delete(id));
    return res.status === 204 ? { success: true } : res.data;
  },

  async view(id) {
    const { data } = await apiClient.get(API_URLS.files.view(id));
    return data; // envelope with data: FileSummaryResponse (fileUrl may be null)
  },

  async downloadUrl(id) {
    const { data } = await apiClient.get(API_URLS.files.downloadUrl(id));
    return data; // envelope with data: { downloadUrl }
  },

  async listByUser(userId) {
    const { data } = await apiClient.get(API_URLS.files.listByUser(userId));
    return data; // envelope with data: array
  },

  async quota() {
    const { data } = await apiClient.get(API_URLS.files.quota);
    return data; // envelope with data: QuotaResponse
  },

  async share(id, email) {
    const { data } = await apiClient.post(API_URLS.files.share(id), { email });
    return data; // envelope with data: SharedFileResponse
  },

  async sharedWithMe() {
    const { data } = await apiClient.get(API_URLS.files.sharedWithMe);
    return data; // envelope with data: List<SharedFileResponse>
  },

  async sharedByMe() {
    const { data } = await apiClient.get(API_URLS.files.sharedByMe);
    return data; // envelope with data: List<SharedFileResponse>
  },

  async favorites() {
    const { data } = await apiClient.get(API_URLS.files.favorites);
    return data; // envelope with data: List<FileSummaryResponse>
  },

  async setFavorite(id, value) {
    const { data } = await apiClient.patch(API_URLS.files.setFavorite(id, value));
    return data; // envelope with data: FileSummaryResponse
  },
};

export default filesApi;
