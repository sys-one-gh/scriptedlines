import { useState, useEffect, useCallback, useRef } from "react";
import { paperSizes } from "../data/paperSizes";
import PaperSpace from "../components/PaperSpace";
import "../App.css";
import LeftPanel from "../components/LeftPanel";

// ─── LAYOUT CONSTANTS ────────────────────────────────────────
const LEFT_MIN = 10;      // minimum left panel width in %
const LEFT_MAX = 18;      // maximum left panel width in %
const RIGHT_W  = 13;      // right panel width in % (fixed)
const TOP_H    = "10vh";  // top bar height

function Workspace() {

  // ─── PAPER SIZE ──────────────────────────────────────────────
  const paper = paperSizes.ARCH_D;

  // ─── BACKEND CONNECTION STATUS ───────────────────────────────
  const [backendStatus, setBackendStatus] = useState("connecting...");

  useEffect(() => {
    fetch("http://localhost:8000/api/health")
      .then((res) => res.json())
      .then((data) => {
        setBackendStatus(data.status === "ok" ? "connected ✔" : "disconnected ✗");
      })
      .catch(() => setBackendStatus("disconnected ✗"));
  }, []);

  // ─── PANEL WIDTHS IN STATE ───────────────────────────────────
  // leftWidth drives all three column widths dynamically.
  // centerWidth is derived — always fills remaining space.
  const [leftWidth, setLeftWidth] = useState(15); // default 15%

  // Center always fills what left and right don't use
  // Subtract 5px divider from calculation to keep total at 100%
  const centerWidth = 100 - leftWidth - RIGHT_W;

  // ─── RESIZE DRAG STATE ───────────────────────────────────────
  const isDragging   = useRef(false);
  const dragStartX   = useRef(0);
  const dragStartW   = useRef(0);
  const containerRef = useRef(null);

  // ─── DRAG HANDLERS ───────────────────────────────────────────
  function handleDividerMouseDown(e) {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = leftWidth;
  }

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    if (!containerRef.current) return;

    const containerW = containerRef.current.getBoundingClientRect().width;
    const deltaX     = e.clientX - dragStartX.current;
    const deltaPct   = (deltaX / containerW) * 100;
    const newWidth   = dragStartW.current + deltaPct;

    // Clamp strictly between min and max
    const clamped = Math.min(Math.max(newWidth, LEFT_MIN), LEFT_MAX);
    setLeftWidth(clamped);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup",   handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup",   handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* ── TOP BAR ───────────────────────────────────────────── */}
      <div className="top-bar" style={{ height: TOP_H }}>
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

      {/* ── MAIN LAYOUT ───────────────────────────────────────── */}
      <div
        className="main-layout"
        ref={containerRef}
      >

        {/* ── LEFT PANEL ──────────────────────────────────────── */}
        <div
          className="left-panel"
          style={{ width: `${leftWidth}%` }}
        >
          <LeftPanel leftWidth={leftWidth} />
        </div>

        {/* ── RESIZE DIVIDER ──────────────────────────────────── */}
        <div
          className="panel-divider"
          onMouseDown={handleDividerMouseDown}
          title="Drag to resize panel"
        />

        {/* ── CENTER PANEL ────────────────────────────────────── */}
        <div
          className="center-panel"
          style={{ width: `${centerWidth}%` }}
        >
          <PaperSpace paper={paper} />
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────── */}
        <div
          className="right-panel"
          style={{ width: `${RIGHT_W}%` }}
        >
          Properties
        </div>

      </div>

    </div>
  );
}

export default Workspace;