// ─────────────────────────────────────────────────────────────
// Workspace.jsx
// Main drawing workspace — top bar, left panel, canvas, right panel.
// Standards: SCRIPTEDLINES_STANDARDS.md
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { paperSizes } from "../data/paperSizes";
import PaperSpace from "../components/PaperSpace";
import CADToolbar from "../components/CADToolbar";
import LeftPanel  from "../components/LeftPanel";
import "../App.css";

// ─── LAYOUT CONSTANTS ────────────────────────────────────────
const LEFT_MIN  = 10;
const LEFT_MAX  = 18;
const RIGHT_MIN = 10;
const RIGHT_MAX = 22;
const API       = "http://localhost:8000/api";

// ─── RIGHT PANEL TABS ────────────────────────────────────────
const RIGHT_TABS = [
  { id: "info",       label: "Info"        },
  { id: "products",   label: "Products"    },
  { id: "bom",        label: "BOM"         },
  { id: "hardware",   label: "Hardware"    },
  { id: "notes",      label: "Notes"       },
  { id: "titleblock", label: "Title Block" },
];

// ─── SHARED STYLES ───────────────────────────────────────────
const LABEL_STYLE = {
  fontSize:      "11px",
  color:         "#555555",
  fontFamily:    "var(--font-mono)",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  marginBottom:  "3px",
  display:       "block",
};
const INPUT_STYLE = {
  width:        "100%",
  background:   "#141414",
  border:       "1px solid #2a2a2a",
  borderRadius: "3px",
  color:        "#cccccc",
  fontSize:     "13px",
  fontFamily:   "var(--font-ui)",
  padding:      "6px 8px",
  marginBottom: "10px",
  outline:      "none",
  boxSizing:    "border-box",
};
const READONLY_STYLE = {
  ...INPUT_STYLE,
  color:      "#555555",
  background: "#0d0d0d",
  cursor:     "not-allowed",
};
const SECTION_STYLE = {
  fontSize:      "11px",
  color:         "#4f8ef7",
  fontFamily:    "var(--font-mono)",
  letterSpacing: "1px",
  textTransform: "uppercase",
  padding:       "10px 0 6px",
  borderBottom:  "1px solid #1e1e1e",
  marginBottom:  "10px",
};

// ─── WORKSPACE COMPONENT ─────────────────────────────────────
function Workspace() {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────
  const [drawing,       setDrawing]       = useState(null);
  const [project,       setProject]       = useState(null);
  const [paper,         setPaper]         = useState(paperSizes.Arch_D);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState("");
  const [backendStatus, setBackendStatus] = useState("connecting...");
  const [activeTool,    setActiveTool]    = useState("select");
  const [unsaved,       setUnsaved]       = useState(false);

  // ── Panel widths ─────────────────────────────────────────
  const [leftWidth,  setLeftWidth]  = useState(15);
  const [rightWidth, setRightWidth] = useState(13);
  const centerWidth = 100 - leftWidth - rightWidth;

  // ── Right panel tab ──────────────────────────────────────
  const [rightTab, setRightTab] = useState("info");

  // Right tab scroll — mirrors LeftPanel overflow detection
  const rightTabBarRef        = useRef(null);
  const [rightCanScrollLeft,  setRightCanScrollLeft]  = useState(false);
  const [rightCanScrollRight, setRightCanScrollRight] = useState(false);

  function checkRightTabOverflow() {
    const bar = rightTabBarRef.current;
    if (!bar) return;
    setRightCanScrollLeft(bar.scrollLeft > 0);
    setRightCanScrollRight(bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 1);
  }

  useEffect(() => {
    const t = setTimeout(checkRightTabOverflow, 50);
    return () => clearTimeout(t);
  }, [rightWidth]);

  // ── Load drawing from DB ─────────────────────────────────
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
        setPaper(paperSizes[d.paper_size || "Arch_D"] || paperSizes.Arch_D);
      } catch {
        setLoadError("Could not connect to server.");
      }
      setLoading(false);
    }
    loadDrawing();
  }, []);

  // ── Backend health check ─────────────────────────────────
  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(d => setBackendStatus(d.status === "ok" ? "connected" : "disconnected"))
      .catch(() => setBackendStatus("disconnected"));
  }, []);

  // ── Panel resize drag ────────────────────────────────────
  const isDraggingLeft  = useRef(false);
  const isDraggingRight = useRef(false);
  const dragStartX      = useRef(0);
  const dragStartW      = useRef(0);
  const containerRef    = useRef(null);

  function handleLeftDividerMouseDown(e) {
    e.preventDefault();
    isDraggingLeft.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = leftWidth;
  }

  function handleRightDividerMouseDown(e) {
    e.preventDefault();
    isDraggingRight.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = rightWidth;
  }

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const cw = containerRef.current.getBoundingClientRect().width;
    if (isDraggingLeft.current) {
      const d = ((e.clientX - dragStartX.current) / cw) * 100;
      setLeftWidth(Math.min(Math.max(dragStartW.current + d, LEFT_MIN), LEFT_MAX));
    }
    if (isDraggingRight.current) {
      const d = ((dragStartX.current - e.clientX) / cw) * 100;
      setRightWidth(Math.min(Math.max(dragStartW.current + d, RIGHT_MIN), RIGHT_MAX));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingLeft.current  = false;
    isDraggingRight.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup",   handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup",   handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ── Zoom fit ─────────────────────────────────────────────
  const zoomFitRef = useRef(null);
  function handleZoomFit() {
    if (zoomFitRef.current) zoomFitRef.current();
  }

  // ── Save shell (Phase 7 fuels svg_data) ──────────────────
  async function handleSave() {
    if (!drawing) return;
    try {
      const res = await fetch(`${API}/drawings/${drawing.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ svg_data: drawing.svg_data || null }),
      });
      if (res.ok) setUnsaved(false);
    } catch { /* Phase 7 error handling */ }
  }

  // ── Sign out ─────────────────────────────────────────────
  function signOut() {
    localStorage.removeItem("sl_user");
    localStorage.removeItem("sl_drawing");
    localStorage.removeItem("sl_project");
    navigate("/login");
  }

  // ── Loading / error screens ──────────────────────────────
  if (loading) {
    return (
      <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#888", fontFamily: "var(--font-mono)", fontSize: "14px" }}>Loading drawing...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <span style={{ color: "#f47070", fontFamily: "var(--font-mono)", fontSize: "14px" }}>{loadError}</span>
        <button onClick={() => navigate("/projects")} style={{ padding: "8px 20px", background: "#4f8ef7", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          ← Back to Projects
        </button>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* ══ TOP BAR ══════════════════════════════════════════
          Height matches ProjectsPage (52px).
          Left:  SL logo + Design Studio + drawing identity
          Right: connection status + sign out
      ════════════════════════════════════════════════════════ */}
      <div style={{
        height:         "52px",
        flexShrink:     0,
        background:     "#111111",
        borderBottom:   "1px solid #1e1e1e",
        display:        "flex",
        alignItems:     "center",
        padding:        "0 16px",
        justifyContent: "space-between",
        zIndex:         100,
      }}>

        {/* Left — logo + drawing info */}
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>

          {/* SL logo */}
          <div style={{
            width: "34px", height: "34px", flexShrink: 0,
            background:   "linear-gradient(135deg, #4f8ef7 0%, #2563eb 100%)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: "13px", fontWeight: "800", fontFamily: "var(--font-ui)", letterSpacing: "-0.5px" }}>SL</span>
          </div>

          {/* Wordmark */}
          <div style={{ marginLeft: "10px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: "14px", fontWeight: "700", fontFamily: "var(--font-ui)", letterSpacing: "-0.3px", lineHeight: 1.1 }}>ScriptedLines</span>
            <span style={{ color: "#4f8ef7", fontSize: "9px", fontFamily: "var(--font-mono)", letterSpacing: "1.5px", textTransform: "uppercase" }}>DESIGN STUDIO</span>
          </div>

          <div style={{ width: "1px", height: "22px", background: "#1e1e1e", margin: "0 16px", flexShrink: 0 }} />

          {/* Back to Projects */}
          <button onClick={() => navigate("/projects")} style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: "4px", color: "#888", fontSize: "12px", fontFamily: "var(--font-ui)", padding: "4px 10px", cursor: "pointer", flexShrink: 0 }}>
            ← Projects
          </button>

          <div style={{ width: "1px", height: "22px", background: "#1e1e1e", margin: "0 16px", flexShrink: 0 }} />

          {/* Drawing identity: D1080 — Title · Rev 00 */}
          {drawing && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#4f8ef7", fontSize: "13px", fontWeight: "700", fontFamily: "var(--font-mono)" }}>{drawing.drawing_number}</span>
              <span style={{ color: "#333" }}>—</span>
              <span style={{ color: "#cccccc", fontSize: "13px", fontFamily: "var(--font-ui)", fontWeight: "500" }}>{drawing.title}</span>
              <span style={{ color: "#333" }}>·</span>
              <span style={{ color: "#888", fontSize: "12px", fontFamily: "var(--font-mono)" }}>Rev {drawing.revision || "00"}</span>
            </div>
          )}
        </div>

        {/* Right — connection + sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: backendStatus === "connected" ? "#4caf50" : "#f44336" }} />
            <span style={{ fontSize: "11px", color: backendStatus === "connected" ? "#4caf50" : "#f44336", fontFamily: "var(--font-mono)" }}>{backendStatus}</span>
          </div>
          <div style={{ width: "1px", height: "18px", background: "#1e1e1e" }} />
          <button onClick={signOut} style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: "4px", color: "#888", fontSize: "11px", fontFamily: "var(--font-ui)", padding: "4px 10px", cursor: "pointer" }}>
            Sign Out
          </button>
        </div>

      </div>

      {/* ══ MAIN LAYOUT ══════════════════════════════════════ */}
      <div className="main-layout" ref={containerRef}>

        {/* Left panel */}
        <div className="left-panel" style={{ width: `${leftWidth}%` }}>
          <LeftPanel leftWidth={leftWidth} />
        </div>

        {/* Left resize divider */}
        <div className="panel-divider" onMouseDown={handleLeftDividerMouseDown} title="Drag to resize" />

        {/* Center — CAD toolbar + canvas */}
        <div className="center-panel" style={{ width: `${centerWidth}%`, display: "flex", flexDirection: "column" }}>
          <CADToolbar activeTool={activeTool} onToolChange={setActiveTool} onZoomFit={handleZoomFit} />
          <PaperSpace
            paper={paper}
            drawing={drawing}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            registerZoomFit={fn => { zoomFitRef.current = fn; }}
            onUnsavedChange={() => setUnsaved(true)}
            onSave={handleSave}
          />
        </div>

        {/* Right resize divider */}
        <div className="panel-divider" onMouseDown={handleRightDividerMouseDown} title="Drag to resize" />

        {/* Right panel — drawing brain */}
        <div className="right-panel" style={{ width: `${rightWidth}%`, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Tab bar — identical structure to LeftPanel */}
          <div className="tab-bar-wrapper">
            <button
              className="tab-scroll-btn"
              onClick={() => rightTabBarRef.current?.scrollBy({ left: -80, behavior: "smooth" })}
              style={{ opacity: rightCanScrollLeft ? 1 : 0, pointerEvents: rightCanScrollLeft ? "auto" : "none" }}
            >‹</button>
            <div className="tab-bar" ref={rightTabBarRef} onScroll={checkRightTabOverflow}>
              {RIGHT_TABS.map(t => (
                <button key={t.id} className={`tab${rightTab === t.id ? " active" : ""}`} onClick={() => setRightTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <button
              className="tab-scroll-btn"
              onClick={() => rightTabBarRef.current?.scrollBy({ left: 80, behavior: "smooth" })}
              style={{ opacity: rightCanScrollRight ? 1 : 0, pointerEvents: rightCanScrollRight ? "auto" : "none" }}
            >›</button>
          </div>

          {/* Tab content — .tab-content class = same padding as left panel */}
          <div className="tab-content">
            {rightTab === "info"       && <RightPanelInfo       drawing={drawing} paper={paper} project={project} />}
            {rightTab === "products"   && <RightPanelProducts   drawing={drawing} />}
            {rightTab === "bom"        && <RightPanelBOM        drawing={drawing} />}
            {rightTab === "hardware"   && <RightPanelHardware   drawing={drawing} />}
            {rightTab === "notes"      && <RightPanelNotes      drawing={drawing} />}
            {rightTab === "titleblock" && <RightPanelTitleBlock drawing={drawing} project={project} />}
          </div>

        </div>

      </div>
    </div>
  );
}

// ─── RIGHT PANEL — INFO ──────────────────────────────────────
function RightPanelInfo({ drawing, paper, project }) {
  if (!drawing) return <PanelEmpty label="No drawing loaded" />;
  const rows = [
    ["Drawing #",  drawing.drawing_number],
    ["Title",      drawing.title],
    ["Revision",   `Rev ${drawing.revision || "00"}`],
    ["Status",     drawing.status?.replace(/_/g, " ")],
    ["Paper",      paper?.label],
    ["Scale",      drawing.scale || "1:20"],
    ["Level",      drawing.level || "—"],
    ["Location",   drawing.location || "—"],
    ["Arch Ref",   drawing.arch_ref || "—"],
    ["MW#",        drawing.mw_number || "—"],
    ["Project",    project?.project_name || "—"],
  ];
  return (
    <div>
      {rows.map(([label, value]) => (
        <div key={label} style={{ padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: "10px", color: "#555", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "3px" }}>
            {label}
          </div>
          <div style={{ fontSize: "13px", color: "#cccccc", fontFamily: "var(--font-ui)", wordBreak: "break-word" }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── RIGHT PANEL — PRODUCTS ──────────────────────────────────
function RightPanelProducts() {
  return <PanelEmpty label="Products" sub="Drop products onto canvas to see them here" />;
}

// ─── RIGHT PANEL — BOM ───────────────────────────────────────
function RightPanelBOM() {
  return <PanelEmpty label="Bill of Materials" sub="Generated when products are on canvas" />;
}

// ─── RIGHT PANEL — HARDWARE ──────────────────────────────────
function RightPanelHardware() {
  return <PanelEmpty label="Hardware" sub="Hardware items from BOM" />;
}

// ─── RIGHT PANEL — NOTES ─────────────────────────────────────
function RightPanelNotes() {
  return <PanelEmpty label="Notes" sub="Drawing notes — Phase 7" />;
}

// ─── RIGHT PANEL — TITLE BLOCK ───────────────────────────────
// Loads drawing_templates record for this project.
// Read-only fields come from existing DB tables.
// Editable fields save to drawing_templates via PUT /api/templates/project/:id.
// Compliance fields (AWMAC, AWI) set at project creation — not shown here.
// Per-drawing overrides: drawings.title_block_overrides JSON (Phase 8).
function RightPanelTitleBlock({ drawing, project }) {
  const [template, setTemplate] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState("");

  useEffect(() => {
    if (!project?.id) return;
    setLoading(true);
    fetch(`${API}/templates/project/${project.id}`)
      .then(r => r.json())
      .then(d => { setTemplate(d.template || {}); setLoading(false); })
      .catch(() => { setTemplate({}); setLoading(false); });
  }, [project?.id]);

  async function saveTemplate() {
    if (!project?.id || !template) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`${API}/templates/project/${project.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(template),
      });
      setSaveMsg(res.ok ? "Saved ✓" : "Error saving");
    } catch { setSaveMsg("Error saving"); }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 2500);
  }

  function update(field, value) {
    setTemplate(t => ({ ...t, [field]: value }));
  }

  if (loading) return <PanelEmpty label="Loading template..." />;

  return (
    <div>

      {/* Read-only — from DB */}
      <div style={SECTION_STYLE}>From Database</div>
      {[
        ["Project",      project?.project_name     || ""],
        ["Drawing #",    drawing?.drawing_number    || ""],
        ["Title",        drawing?.title             || ""],
        ["Revision",     `Rev ${drawing?.revision   || "00"}`],
        ["Scale",        drawing?.scale             || "1:20"],
        ["Level",        drawing?.level             || ""],
        ["Arch Ref",     drawing?.arch_ref          || ""],
      ].map(([lbl, val]) => (
        <div key={lbl}>
          <span style={LABEL_STYLE}>{lbl}</span>
          <input style={READONLY_STYLE} readOnly value={val} />
        </div>
      ))}

      {/* Company — editable */}
      <div style={SECTION_STYLE}>Company</div>
      {[
        ["Company Name",    "company_name"],
        ["Address",         "company_address"],
        ["Phone",           "company_phone"],
        ["Fax",             "company_fax"],
        ["Email",           "company_email"],
      ].map(([lbl, key]) => (
        <div key={key}>
          <span style={LABEL_STYLE}>{lbl}</span>
          <input style={INPUT_STYLE} value={template[key] || ""} onChange={e => update(key, e.target.value)} />
        </div>
      ))}

      {/* Project team — editable */}
      <div style={SECTION_STYLE}>Project Team</div>
      {[
        ["Client Name",   "client_name"],
        ["Client Address","client_address"],
        ["Contractor",    "contractor_name"],
        ["Architect",     "architect_name"],
        ["Drawn By",      "drawn_by"],
        ["Checked By",    "checked_by"],
      ].map(([lbl, key]) => (
        <div key={key}>
          <span style={LABEL_STYLE}>{lbl}</span>
          <input style={INPUT_STYLE} value={template[key] || ""} onChange={e => update(key, e.target.value)} />
        </div>
      ))}

      {/* Notes — editable */}
      <div style={SECTION_STYLE}>Notes</div>
      <span style={LABEL_STYLE}>Important Notes</span>
      <textarea style={{ ...INPUT_STYLE, height: "72px", resize: "vertical" }} value={template.important_notes || ""} onChange={e => update("important_notes", e.target.value)} />
      <span style={LABEL_STYLE}>Material Core Notes</span>
      <textarea style={{ ...INPUT_STYLE, height: "72px", resize: "vertical" }} value={template.material_notes || ""} onChange={e => update("material_notes", e.target.value)} />

      {/* Approval stamp */}
      <div style={SECTION_STYLE}>Approval Stamp</div>
      <span style={LABEL_STYLE}>Stamp Text</span>
      <input style={INPUT_STYLE} value={template.approval_stamp_text || ""} onChange={e => update("approval_stamp_text", e.target.value)} />
      <span style={LABEL_STYLE}>Approved By</span>
      <input style={INPUT_STYLE} value={template.approval_name || ""} onChange={e => update("approval_name", e.target.value)} />

      {/* Save */}
      <button
        onClick={saveTemplate}
        disabled={saving}
        style={{
          width: "100%", padding: "9px",
          background: "#4f8ef7", border: "none", borderRadius: "4px",
          color: "#fff", fontSize: "13px", fontWeight: "600",
          fontFamily: "var(--font-ui)",
          cursor: saving ? "not-allowed" : "pointer",
          marginTop: "8px", opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "Saving..." : saveMsg || "Save Template"}
      </button>

    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────
function PanelEmpty({ label, sub }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "32px 8px", textAlign: "center" }}>
      <div style={{ fontSize: "24px", opacity: 0.1 }}>⬡</div>
      <div style={{ fontSize: "12px", color: "#444", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      {sub && <div style={{ fontSize: "12px", color: "#333", fontFamily: "var(--font-ui)", lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

export default Workspace;