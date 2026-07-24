// ─────────────────────────────────────────────────────────────
// api/client.js
//
// Single source of truth for talking to the backend:
//   - API_BASE reads VITE_API_URL (falls back to localhost for
//     plain `npm run dev` outside Docker). In the Docker dev stack,
//     VITE_API_URL is set in docker-compose.yml's `environment:`
//     block for the frontend service and read live by the Vite
//     dev server on each request — it is NOT baked in at build
//     time, so changing it in docker-compose.yml just needs a
//     container restart, not a rebuild.
//   - Session (user + JWT) lives in localStorage under two keys.
//   - apiFetch() attaches the Authorization header automatically
//     and, on a 401, clears the stale session and bounces to
//     /login — used for every call made *after* the user is
//     signed in. Login/register themselves use plain fetch()
//     since there's no token yet.
//
// Every frontend module that talks to the backend imports from
// here — there should be no other place in the codebase that
// hardcodes an API origin or touches sl_user/sl_token directly.
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
