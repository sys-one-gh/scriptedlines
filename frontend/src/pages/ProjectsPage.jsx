import { useNavigate } from "react-router-dom";

function ProjectsPage() {
  const navigate = useNavigate();

  function handleSignOut() {
    localStorage.removeItem("sl_user");
    navigate("/login");
  }

  const user = JSON.parse(localStorage.getItem("sl_user") || "{}");

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#111111",
      display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Top bar */}
      <div style={{
        width: "100%", height: "10vh",
        background: "#1a1a1a",
        borderBottom: "1px solid #2e2e2e",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "30px", height: "30px",
            background: "#4f8ef7", borderRadius: "5px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: "700", color: "#fff",
            fontFamily: "'IBM Plex Sans', monospace",
          }}>SL</div>
          <span style={{ fontSize: "16px", fontWeight: "600", color: "#ffffff" }}>
            ScriptedLines
          </span>
        </div>

        {/* User info + sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13px", color: "#666666" }}>
            {user.first_name} {user.last_name}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              height: "32px", padding: "0 16px",
              background: "transparent",
              border: "1px solid #3a3a3a",
              borderRadius: "4px",
              color: "#aaaaaa", fontSize: "12px",
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Placeholder content */}
      <div style={{
        flex: 1, display: "flex",
        alignItems: "center", justifyContent: "center",
        color: "#333333", fontSize: "14px",
      }}>
        Projects Page — Coming in Phase 5
      </div>

    </div>
  );
}

export default ProjectsPage;