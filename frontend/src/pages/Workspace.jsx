import { useState, useEffect } from "react";
import { paperSizes } from "../data/paperSizes";
import PaperSpace from "../components/PaperSpace";
import "../App.css";
import LeftPanel from "../components/LeftPanel";

function Workspace() {

  // ─── PAPER SIZE ──────────────────────────────────────────────
  // Default paper: Arch D 36" x 24"
  // Later this will come from a dropdown in the top bar
  const paper = paperSizes.ARCH_D;


  // ─── BACKEND CONNECTION STATUS ───────────────────────────────
  // Pings the Python backend health check endpoint on startup.
  // Displays connection status in the top bar temporarily.
  // States: "connecting..." → "connected" or "disconnected"
  const [backendStatus, setBackendStatus] = useState("connecting...");

  useEffect(() => {
    fetch("http://localhost:8000/api/health")
      .then((res) => res.json())
      .then((data) => {
        // Backend responded with ok status
        if (data.status === "ok") {
          setBackendStatus("connected ✔");
        } else {
          setBackendStatus("disconnected ✗");
        }
      })
      .catch(() => {
        // Backend is not reachable — server may not be running
        setBackendStatus("disconnected ✗");
      });
  }, []); // runs once on mount


  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* ── TOP BAR ─────────────────────────────────────────────
          10% of screen height.
          Temporarily shows backend connection status.
          Will hold: logo, project name, drawing number,
          page navigation, save, export buttons later.
      ──────────────────────────────────────────────────────── */}
      <div className="top-bar">
        <span>ScriptedLines</span>
        <span
          style={{
            marginLeft: "20px",
            fontSize: "11px",
            color: backendStatus.includes("connected ✔") ? "#4caf50" : "#f44336",
            fontFamily: "var(--font-tech)",
          }}
        >
          backend: {backendStatus}
        </span>
      </div>

      {/* ── MAIN LAYOUT ─────────────────────────────────────────
          Remaining 90% split into three columns:
          Left panel 20% | Center canvas 67% | Right panel 13%
      ──────────────────────────────────────────────────────── */}
      <div className="main-layout">

        {/* ── LEFT PANEL ────────────────────────────────────────
            20% width — tool library (walls, products, parts,
            hardware, materials).
        ─────────────────────────────────────────────────────── */}
        <div className="left-panel">
          <LeftPanel />
        </div>

        {/* ── CENTER PANEL ──────────────────────────────────────
            67% width — main drawing canvas.
            No padding, no overflow here.
            PaperSpace fills this entirely and handles
            its own scrolling, zoom, and pan internally.
        ─────────────────────────────────────────────────────── */}
        <div className="center-panel">
          <PaperSpace paper={paper} />
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────────────
            13% width — selected object properties.
            Will show placed objects list, dimensions,
            material and hardware info when object is selected.
        ─────────────────────────────────────────────────────── */}
        <div className="right-panel">
          Properties
        </div>

      </div>

    </div>
  );
}

export default Workspace;