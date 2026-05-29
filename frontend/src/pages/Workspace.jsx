// ─────────────────────────────────────────────────────────────
// Workspace.jsx
//
// Main drawing workspace page.
// Loads drawing from DB via localStorage handoff from ProjectsPage.
// Top bar: logo, navigation, drawing info, tool actions.
// CAD toolbar: vertical tool palette left of canvas.
// Center: PaperSpace canvas with paper sized from DB.
// Right panel: Properties (Phase 7).
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { paperSizes } from "../data/paperSizes";
import PaperSpace  from "../components/PaperSpace";
import CADToolbar  from "../components/CADToolbar";
import "../App.css";
import LeftPanel from "../components/LeftPanel";

// ─── LAYOUT CONSTANTS ────────────────────────────────────────
const LEFT_MIN = 10;
const LEFT_MAX = 18;
const RIGHT_W  = 13;   // right panel width %
const TOP_H    = 52;   // top bar height px (fixed, not vh)
const API      = "http://localhost:8000/api";

// ─── STATUS DISPLAY LABELS ───────────────────────────────────
// Mirrors ProjectsPage status labels for consistency
const STATUS_LABELS = {
  draft:    "In Drafting",
  review:   "In Review",
  approved: "Reviewed as Noted",
  issued:   "Final Release",
};

const STATUS_COLORS = {
  draft:    { color: "#888888", bg: "#1a1a1a",  border: "#2a2a2a" },
  review:   { color: "#e6a817", bg: "#221a00",  border: "#4a3800" },
  approved: { color: "#4caf50", bg: "#0a1f0a",  border: "#1a4a1a" },
  issued:   { color: "#4f8ef7", bg: "#0a1525",  border: "#1a3a6a" },
};

function Workspace() {
  const navigate = useNavigate();

  // ─── LOAD DRAWING FROM DB ────────────────────────────────
  // ProjectsPage stores drawing + project in localStorage when
  // user clicks Open. We fetch the full drawing record here.
  const [drawing,   setDrawing]   = useState(null);
  const [project,   setProject]   = useState(null);
  const [paper,     setPaper]     = useState(paperSizes.Arch_D);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadDrawing() {
      setLoading(true);

      const storedDrawing = localStorage.getItem("sl_drawing");
      const storedProject = localStorage.getItem("sl_project");

      if (!storedDrawing || !storedProject) {
        setLoadError("No drawing selected. Go back to Projects.");
        setLoading(false);
        return;
      }

      const drawingMeta = JSON.parse(storedDrawing);
      const projectMeta = JSON.parse(storedProject);
      setProject(projectMeta);

      try {
        const res  = await fetch(`${API}/drawings/${drawingMeta.id}`);
        const data = await res.json();

        if (!res.ok || !data.drawing) {
          setLoadError("Drawing not found.");
          setLoading(false);
          return;
        }

        const d = data.drawing;
        setDrawing(d);

        // Paper size comes from DB — never hardcoded
        const paperKey = d.paper_size || "Arch_D";
        setPaper(paperSizes[paperKey] || paperSizes.Arch_D);

      } catch {
        setLoadError("Could not connect to server.");
      }

      setLoading(false);
    }

    loadDrawing();
  }, []);

  // ─── CONNECTION STATUS ───────────────────────────────────
  const [backendStatus, setBackendStatus] = useState("connecting...");

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(d => setBackendStatus(d.status === "ok" ? "connected" : "disconnected"))
      .catch(() => setBackendStatus("disconnected"));
  }, []);

  // ─── ACTIVE CAD TOOL ─────────────────────────────────────
  // Passed down to CADToolbar and PaperSpace.
  // "select" and "pan" are functional now.
  // All other tools are placeholders until Phase 7.
  const [activeTool, setActiveTool] = useState("select");

  // ─── UNSAVED CHANGES ─────────────────────────────────────
  // Set to true when canvas is modified — cleared on save.
  // Phase 7 wires this to actual svg_data changes.
  const [unsaved, setUnsaved] = useState(false);

  // ─── PANEL WIDTHS ────────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(15);
  const centerWidth = 100 - leftWidth - RIGHT_W;

  // ─── PANEL RESIZE DRAG ───────────────────────────────────
  const isDragging   = useRef(false);
  const dragStartX   = useRef(0);
  const dragStartW   = useRef(0);
  const containerRef = useRef(null);

  function handleDividerMouseDown(e) {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = leftWidth;
  }

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return;
    const cw       = containerRef.current.getBoundingClientRect().width;
    const deltaPct = ((e.clientX - dragStartX.current) / cw) * 100;
    setLeftWidth(Math.min(Math.max(dragStartW.current + deltaPct, LEFT_MIN), LEFT_MAX));
  }, []);

  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup",   handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup",   handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ─── ZOOM FIT CALLBACK ───────────────────────────────────
  // PaperSpace registers its resetZoom function here via ref.
  // CADToolbar calls handleZoomFit → triggers PaperSpace zoom reset.
  const zoomFitRef = useRef(null);
  function handleZoomFit() {
    if (zoomFitRef.current) zoomFitRef.current();
  }

  // ─── TOOL ACTION HANDLERS ────────────────────────────────
  // Placeholder handlers — Phase 7 wires real functionality

  function handleSave() {
    // Phase 7: PUT /api/drawings/:id with svg_data
    console.log("Save — Phase 7");
  }

  function handleUndo() {
    // Phase 7: undo canvas action
    console.log("Undo — Phase 7");
  }

  function handleRedo() {
    // Phase 7: redo canvas action
    console.log("Redo — Phase 7");
  }

  function handleAddRevision() {
    // Phase 7: POST /api/drawings/:id/revisions
    console.log("Add Revision — Phase 7");
  }

  function handleExport() {
    // Phase 8: export drawing to PDF
    console.log("Export — Phase 8");
  }

  // ─── STATUS COLORS ───────────────────────────────────────
  const statusKey    = drawing?.status || "draft";
  const statusColors = STATUS_COLORS[statusKey] || STATUS_COLORS.draft;
  const statusLabel  = STATUS_LABELS[statusKey]  || statusKey;

  // ─── LOADING / ERROR STATES ──────────────────────────────
  if (loading) {
    return (
      <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#888", fontFamily: "var(--font-mono)", fontSize: "14px" }}>
          Loading drawing...
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <span style={{ color: "#f47070", fontFamily: "var(--font-mono)", fontSize: "14px" }}>{loadError}</span>
        <button
          onClick={() => navigate("/projects")}
          style={{ padding: "8px 20px", background: "#4f8ef7", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontFamily: "var(--font-ui)" }}
        >
          ← Back to Projects
        </button>
      </div>
    );
  }

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* ════ TOP BAR ════════════════════════════════════════ */}
      <div style={TB.bar}>

        {/* ── LEFT: Logo + Back ──────────────────────────── */}
        <div style={TB.left}>

          {/* SL logo mark — same as ProjectsPage */}
          <div style={TB.logoMark}>
            <span style={TB.logoMarkText}>SL</span>
          </div>

          {/* Separator */}
          <div style={TB.sep} />

          {/* Back to Projects */}
          <button style={TB.backBtn} onClick={() => navigate("/projects")}>
            ← Projects
          </button>

          {/* Separator */}
          <div style={TB.sep} />

          {/* Drawing identity from DB */}
          {drawing && (
            <div style={TB.drawingInfo}>
              <span style={TB.drawingNumber}>{drawing.drawing_number}</span>
              <span style={TB.drawingSep}>—</span>
              <span style={TB.drawingTitle}>{drawing.title}</span>
              <span style={TB.drawingSep}>·</span>
              <span style={TB.drawingMeta}>Rev {drawing.revision || "00"}</span>
              <span style={TB.drawingSep}>·</span>
              <span style={TB.drawingMeta}>{paper.label}</span>

              {/* Status badge */}
              <div style={{
                ...TB.statusBadge,
                background:   statusColors.bg,
                color:        statusColors.color,
                borderColor:  statusColors.border,
              }}>
                <div style={{ ...TB.statusDot, background: statusColors.color }} />
                {statusLabel}
              </div>
            </div>
          )}
        </div>

        {/* ── CENTER: Tool actions ───────────────────────── */}
        <div style={TB.center}>

          {/* Undo */}
          <TBtn title="Undo (Phase 7)" disabled onClick={handleUndo}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
          </TBtn>

          {/* Redo */}
          <TBtn title="Redo (Phase 7)" disabled onClick={handleRedo}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
            </svg>
          </TBtn>

          <div style={TB.sep} />

          {/* Save */}
          <TBtn
            title={unsaved ? "Unsaved changes — click to save" : "Save drawing (Phase 7)"}
            disabled
            onClick={handleSave}
            style={unsaved ? { color: "#e6a817", borderColor: "#4a3800" } : {}}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span style={{ fontSize: "11px", marginLeft: "4px" }}>Save</span>
            {unsaved && <div style={TB.unsavedDot} />}
          </TBtn>

          <div style={TB.sep} />

          {/* + Rev */}
          <TBtn title="Add Revision (Phase 7)" disabled onClick={handleAddRevision}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span style={{ fontSize: "11px", marginLeft: "4px" }}>+ Rev</span>
          </TBtn>

          {/* Export */}
          <TBtn title="Export to PDF (Phase 8)" disabled onClick={handleExport}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span style={{ fontSize: "11px", marginLeft: "4px" }}>Export</span>
          </TBtn>

        </div>

        {/* ── RIGHT: Project info + connection ───────────── */}
        <div style={TB.right}>
          {project && (
            <span style={TB.projectMeta}>
              {project.project_name}
              <span style={{ color: "#333", margin: "0 4px" }}>·</span>
              #{project.project_number}
            </span>
          )}
          <div style={TB.sep} />
          {/* Connection status dot */}
          <div style={{
            width:        "7px",
            height:       "7px",
            borderRadius: "50%",
            background:   backendStatus === "connected" ? "#4caf50" : "#f44336",
            flexShrink:   0,
          }} />
          <span style={{
            fontSize:    "11px",
            color:       backendStatus === "connected" ? "#4caf50" : "#f44336",
            fontFamily:  "var(--font-mono)",
          }}>
            {backendStatus}
          </span>
        </div>

      </div>

      {/* ════ MAIN LAYOUT ════════════════════════════════════ */}
      <div className="main-layout" ref={containerRef}>

        {/* Left panel — product library */}
        <div className="left-panel" style={{ width: `${leftWidth}%` }}>
          <LeftPanel leftWidth={leftWidth} />
        </div>

        {/* Left panel resize divider */}
        <div className="panel-divider" onMouseDown={handleDividerMouseDown} title="Drag to resize panel" />

        {/* Center panel — CAD toolbar + drawing canvas stacked vertically */}
        <div className="center-panel" style={{ width: `${centerWidth}%`, display: "flex", flexDirection: "column" }}>

          {/* CAD tool strip — horizontal, top of canvas area */}
          <CADToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onZoomFit={handleZoomFit}
          />

          {/* Drawing canvas — fills remaining height */}
          <PaperSpace
            paper={paper}
            drawing={drawing}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            registerZoomFit={fn => { zoomFitRef.current = fn; }}
          />
        </div>

        {/* Right panel — properties (Phase 7) */}
        <div className="right-panel" style={{ width: `${RIGHT_W}%` }}>
          <div style={{
            padding:    "12px",
            fontSize:   "11px",
            fontFamily: "var(--font-mono)",
            color:      "#333",
            borderBottom: "1px solid #1e1e1e",
            letterSpacing: "1.5px",
            fontWeight: "700",
          }}>
            PROPERTIES
          </div>
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: 0.08,
          }}>
            <div style={{ fontSize: "32px" }}>⬡</div>
            <div style={{ fontSize: "11px", color: "#ffffff", fontFamily: "var(--font-mono)" }}>
              Coming soon
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// ─── TOP BAR BUTTON COMPONENT ────────────────────────────────
// Small icon+label button for the top bar action strip.
function TBtn({ children, title, disabled, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display:        "flex",
        alignItems:     "center",
        height:         "28px",
        padding:        "0 8px",
        background:     "transparent",
        border:         "1px solid transparent",
        borderRadius:   "4px",
        color:          disabled ? "#333333" : "#aaaaaa",
        cursor:         disabled ? "not-allowed" : "pointer",
        fontFamily:     "var(--font-ui)",
        fontSize:       "12px",
        gap:            "2px",
        position:       "relative",
        transition:     "background 0.12s, color 0.12s, border-color 0.12s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── TOP BAR STYLES ──────────────────────────────────────────
const TB = {
  bar: {
    height:          `${TOP_H}px`,
    flexShrink:      0,
    background:      "#111111",
    borderBottom:    "1px solid #1e1e1e",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "space-between",
    padding:         "0 16px",
    gap:             "12px",
    userSelect:      "none",
  },

  // ── Left section ──────────────────────────────────────────
  left: {
    display:     "flex",
    alignItems:  "center",
    gap:         "10px",
    flex:        1,
    minWidth:    0,
    overflow:    "hidden",
  },

  logoMark: {
    width:          "28px",
    height:         "28px",
    background:     "linear-gradient(135deg, #4f8ef7 0%, #2563d4 100%)",
    borderRadius:   "6px",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
    boxShadow:      "0 0 10px rgba(79,142,247,0.3)",
  },

  logoMarkText: {
    fontSize:    "10px",
    fontWeight:  "800",
    color:       "#fff",
    fontFamily:  "var(--font-mono)",
    letterSpacing: "0.5px",
  },

  sep: {
    width:       "1px",
    height:      "18px",
    background:  "#222222",
    flexShrink:  0,
  },

  backBtn: {
    height:      "26px",
    padding:     "0 10px",
    background:  "transparent",
    border:      "1px solid #222",
    borderRadius:"4px",
    color:       "#888888",
    fontSize:    "12px",
    fontFamily:  "var(--font-ui)",
    cursor:      "pointer",
    flexShrink:  0,
    transition:  "border-color 0.12s, color 0.12s",
  },

  drawingInfo: {
    display:    "flex",
    alignItems: "center",
    gap:        "8px",
    overflow:   "hidden",
    minWidth:   0,
  },

  drawingNumber: {
    fontSize:      "13px",
    fontWeight:    "800",
    color:         "#4f8ef7",
    fontFamily:    "var(--font-mono)",
    letterSpacing: "1px",
    flexShrink:    0,
  },

  drawingTitle: {
    fontSize:   "13px",
    color:      "#cccccc",
    fontWeight: "500",
    overflow:   "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  drawingSep: {
    color:      "#2a2a2a",
    fontSize:   "12px",
    flexShrink: 0,
  },

  drawingMeta: {
    fontSize:   "11px",
    color:      "#555555",
    fontFamily: "var(--font-mono)",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },

  statusBadge: {
    display:       "flex",
    alignItems:    "center",
    gap:           "5px",
    fontSize:      "10px",
    fontWeight:    "500",
    padding:       "2px 8px",
    borderRadius:  "3px",
    border:        "1px solid",
    fontFamily:    "var(--font-mono)",
    letterSpacing: "0.3px",
    flexShrink:    0,
  },

  statusDot: {
    width:        "5px",
    height:       "5px",
    borderRadius: "50%",
    flexShrink:   0,
  },

  // ── Center section ────────────────────────────────────────
  center: {
    display:    "flex",
    alignItems: "center",
    gap:        "4px",
    flexShrink: 0,
  },

  unsavedDot: {
    position:     "absolute",
    top:          "4px",
    right:        "4px",
    width:        "5px",
    height:       "5px",
    borderRadius: "50%",
    background:   "#e6a817",
  },

  // ── Right section ─────────────────────────────────────────
  right: {
    display:    "flex",
    alignItems: "center",
    gap:        "8px",
    flexShrink: 0,
  },

  projectMeta: {
    fontSize:   "11px",
    color:      "#444444",
    fontFamily: "var(--font-mono)",
    whiteSpace: "nowrap",
  },
};

export default Workspace;