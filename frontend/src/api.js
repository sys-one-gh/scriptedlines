// ─────────────────────────────────────────────────────────────
// api.js
//
// Single source of truth for talking to the backend:
//   - API_BASE reads VITE_API_URL (falls back to localhost for
//     plain `npm run dev` outside Docker).
//   - Session (user + JWT) lives in localStorage under two keys.
//   - apiFetch() attaches the Authorization header automatically
//     and, on a 401, clears the stale session and bounces to
//     /login — used for every call made *after* the user is
//     signed in. Login/register themselves use plain fetch()
//     since there's no token yet.
// ─────────────────────────────────────────────────────────────

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const USER_KEY  = "sl_user";
const TOKEN_KEY = "sl_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function setSession(user, token) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  return res;
}
