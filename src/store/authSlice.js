import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "auth";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, token: null, isAuthenticated: false };
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user ?? null,
      token: parsed.token ?? null,
      isAuthenticated: Boolean(parsed.token),
    };
  } catch {
    return { user: null, token: null, isAuthenticated: false };
  }
}

function saveToStorage(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: state.user, token: state.token })
    );
  } catch {
    // ignore
  }
}

const initialState = loadFromStorage();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = Boolean(token);
      saveToStorage(state);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    },
    hydrateFromStorage(state) {
      const loaded = loadFromStorage();
      state.user = loaded.user;
      state.token = loaded.token;
      state.isAuthenticated = loaded.isAuthenticated;
    },
  },
});

export const { loginSuccess, logout, hydrateFromStorage } = authSlice.actions;
export default authSlice.reducer;
