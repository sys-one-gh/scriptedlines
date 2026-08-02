// ─────────────────────────────────────────────────────────────
// RequireAuth.jsx
//
// Route guard: redirects to /login if there's no JWT in session.
// Wrap any <Route element> that needs an authenticated user.
// ─────────────────────────────────────────────────────────────

import { Navigate } from "react-router-dom";
import { getToken } from "../api/client.js";

function RequireAuth({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return children;
}

export default RequireAuth;
