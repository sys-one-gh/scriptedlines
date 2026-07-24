// ─────────────────────────────────────────────────────────────
// Workspace.jsx
// Main drawing workspace — top bar, left panel, canvas, right panel.
// Standards: SCRIPTEDLINES_STANDARDS.md
//
// Font sizes use --fs-base/--fs-md/--fs-lg tokens (see tokens.css).
// The ScriptedLines "SL" mark, wordmark, and "DESIGN STUDIO"
// sub-label are the brand mark — intentionally left hardcoded.
// The PanelEmpty glyph (⬡) is an icon — not tokenized, separate pass.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { paperSizes } from "../data/paperSizes";
import PaperSpace from "../components/PaperSpace";
import CADToolbar from "../components/CADToolbar";
import LeftPanel  from "../components/LeftPanel";
import { API_BASE, apiFetch, clearSession } from "../api/client.js";
import { useResizableSidebar } from "../shared/useResizableSidebar.js";
import "../App.css";
import "./Workspace.css";

// ─── LAYOUT CONSTANTS ────────────────────────────────────────
const LEFT_MIN  = 10;
const LEFT_MAX  = 22;
const RIGHT_MIN = 13;
const RIGHT_MAX = 28;

// ─── RIGHT PANEL TABS ────────────────────────────────────────
const RIGHT_TABS = [
  { id: "info",       label: "Info"        },
  { id: "products",   label: "Products"    },
  { id: "bom",        label: "BOM"         },
  { id: "hardware",   label: "Hardware"    },
  { id: "notes",      label: "Notes"       },
  { id: "titleblock", label: "Title Block" },
];

// ─── WORKSPACE COMPONENT ─────────────────────────────────────
function Workspace() {
  const navigate = useNavigate();
  const { drawingId } = useParams();

  const [drawing,       setDrawing]       = useState(null);
  const [project,       setProject]       = useState(null);
  const [paper,         setPaper]         = useState(paperSizes.Arch_D);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState("");
  const [backendStatus, setBackendStatus] = useState("connecting...");
  const [activeTool,    setActiveTool]    = useState("select");
  const [unsaved,       setUnsaved]       = useState(false);

  const containerRef = useRef(null);
  const leftPanel  = useResizableSidebar({ containerRef, initial: 15, min: LEFT_MIN,  max: LEFT_MAX,  invert: false });
  const rightPanel = useResizableSidebar({ containerRef, initial: 18, min: RIGHT_MIN, max: RIGHT_MAX, invert: true });
  const centerWidth = 100 - leftPanel.pct - rightPanel.pct;

  const [rightTab, setRightTab] = useState("info");

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
    const t = setTimeout(checkRightTabOverflow, 100);
    window.addEventListener("resize", checkRightTabOverflow);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", checkRightTabOverflow);
    };
  }, [rightPanel.pct]);

  useEffect(() => {
    async function loadDrawing() {
      setLoading(true);
      try {
        const res  = await apiFetch(`/drawings/${drawingId}`);
        const data = await res.json();
        if (!res.ok || !data.drawing) {
          setLoadError("Drawing not found.");
          setLoading(false);
          return;
        }
        const d = data.drawing;
        setDrawing(d);
        setPaper(paperSizes[d.paper_size || "Arch_D"] || paperSizes.Arch_D);

        // Project lookup is soft-fail, unlike the drawing fetch above:
        // this page only ever reads project?.project_name / project?.id
        // (both already null-guarded downstream), so a failed project
        // fetch shouldn't strand the user on an error screen for a
        // drawing that's otherwise fine — it just shows "—" in its place.
        try {
          const pRes  = await apiFetch(`/projects/${d.project_id}`);
          const pData = await pRes.json();
          setProject(pRes.ok ? pData.project : null);
        } catch {
          setProject(null);
        }
      } catch {
        setLoadError("Could not connect to server.");
      }
      setLoading(false);
    }
    loadDrawing();
  }, [drawingId]);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(r => r.json())
      .then(d => setBackendStatus(d.status === "ok" ? "connected" : "disconnected"))
      .catch(() => setBackendStatus("disconnected"));
  }, []);

  const zoomFitRef = useRef(null);
  function handleZoomFit() {
    if (zoomFitRef.current) zoomFitRef.current();
  }

  async function handleSave() {
    if (!drawing) return;
    try {
      const res = await apiFetch(`/drawings/${drawing.id}`, {
        method:  "PUT",
        body:    JSON.stringify({ svg_data: drawing.svg_data || null }),
      });
      if (res.ok) setUnsaved(false);
    } catch { /* Phase 7 error handling */ }
  }

  function signOut() {
    clearSession();
    navigate("/login");
  }

  if (loading) {
    return (
      <div className="app-container ws-loading">
        <span className="ws-loading-text">Loading drawing...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-container ws-error">
        <span className="ws-error-text">{loadError}</span>
        <button onClick={() => navigate("/projects")} className="ws-error-btn">
          ← Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">

      {/* ══ TOP BAR ══════════════════════════════════════════ */}
      <div className="ws-topbar">

        <div className="ws-topbar-left">

          {/* SL logo — brand mark, intentionally excluded */}
          <div className="ws-logo-mark">
            <span className="ws-logo-mark-text">SL</span>
          </div>

          {/* Wordmark — brand mark, intentionally excluded */}
          <div className="ws-logo-words">
            <span className="ws-logo-main">ScriptedLines</span>
            <span className="ws-logo-sub">DESIGN STUDIO</span>
          </div>

          <div className="ws-topbar-divider" />

          <button onClick={() => navigate("/projects")} className="ws-ghost-btn">
            ← Projects
          </button>

          <div className="ws-topbar-divider" />

          {drawing && (
            <div className="ws-drawing-identity">
              <span className="ws-drawing-number">{drawing.drawing_number}</span>
              <span className="ws-identity-sep">—</span>
              <span className="ws-drawing-title">{drawing.title}</span>
              <span className="ws-identity-sep">·</span>
              <span className="ws-drawing-rev">Rev {drawing.revision || "00"}</span>
            </div>
          )}
        </div>

        <div className="ws-topbar-right">
          <div className="ws-status-group">
            <div className={`ws-status-dot ws-status-dot--${backendStatus === "connected" ? "connected" : "disconnected"}`} />
            <span className={`ws-status-text ws-status-text--${backendStatus === "connected" ? "connected" : "disconnected"}`}>{backendStatus}</span>
          </div>
          <div className="ws-topbar-divider--sm" />
          <button onClick={signOut} className="ws-ghost-btn">
            Sign Out
          </button>
        </div>

      </div>

      {/* ══ MAIN LAYOUT ══════════════════════════════════════ */}
      <div className="main-layout" ref={containerRef}>

        <div className="left-panel" style={{ width: `${leftPanel.pct}%` }}>
          <LeftPanel leftWidth={leftPanel.pct} />
        </div>

        <div className="panel-divider" onMouseDown={leftPanel.onDividerDown} title="Drag to resize" />

        <div className="center-panel" style={{ width: `calc(${centerWidth}% - 11px)` }}>
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

        <div className="panel-divider" onMouseDown={rightPanel.onDividerDown} title="Drag to resize" />

        <div className="right-panel" style={{ width: `${rightPanel.pct}%` }}>

          <div className="tab-bar-wrapper">
            <button
              className="tab-scroll-btn"
              onClick={() => rightTabBarRef.current?.scrollBy({ left: -80, behavior: "smooth" })}
              style={{ opacity: rightCanScrollLeft ? 1 : 0.25, pointerEvents: rightCanScrollLeft ? "auto" : "none" }}
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
              style={{ opacity: rightCanScrollRight ? 1 : 0.25, pointerEvents: rightCanScrollRight ? "auto" : "none" }}
            >›</button>
          </div>

          <div className="ws-tabbar-strip" />

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
    <div className="ws-info-list">
      {rows.map(([label, value]) => (
        <div key={label} className="ws-info-row">
          <div className="ws-info-row-label">{label}</div>
          <div className="ws-info-row-value">{value}</div>
        </div>
      ))}
    </div>
  );
}

function RightPanelProducts() {
  return <PanelEmpty label="Products" sub="Drop products onto canvas to see them here" />;
}

function RightPanelBOM() {
  return <PanelEmpty label="Bill of Materials" sub="Generated when products are on canvas" />;
}

function RightPanelHardware() {
  return <PanelEmpty label="Hardware" sub="Hardware items from BOM" />;
}

function RightPanelNotes() {
  return <PanelEmpty label="Notes" sub="Drawing notes — Phase 7" />;
}

function RightPanelTitleBlock({ drawing, project }) {
  const [template, setTemplate] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState("");

  useEffect(() => {
    if (!project?.id) return;
    setLoading(true);
    apiFetch(`/templates/project/${project.id}`)
      .then(r => r.json())
      .then(d => { setTemplate(d.template || {}); setLoading(false); })
      .catch(() => { setTemplate({}); setLoading(false); });
  }, [project?.id]);

  async function saveTemplate() {
    if (!project?.id || !template) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await apiFetch(`/templates/project/${project.id}`, {
        method:  "PUT",
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

      <div className="ws-tb-section">From Database</div>
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
          <span className="ws-tb-label">{lbl}</span>
          <input className="ws-tb-input ws-tb-input--readonly" readOnly value={val} />
        </div>
      ))}

      <div className="ws-tb-section">Company</div>
      {[
        ["Company Name",    "company_name"],
        ["Address",         "company_address"],
        ["Phone",           "company_phone"],
        ["Fax",             "company_fax"],
        ["Email",           "company_email"],
      ].map(([lbl, key]) => (
        <div key={key}>
          <span className="ws-tb-label">{lbl}</span>
          <input className="ws-tb-input" value={template[key] || ""} onChange={e => update(key, e.target.value)} />
        </div>
      ))}

      <div className="ws-tb-section">Project Team</div>
      {[
        ["Client Name",   "client_name"],
        ["Client Address","client_address"],
        ["Contractor",    "contractor_name"],
        ["Architect",     "architect_name"],
        ["Drawn By",      "drawn_by"],
        ["Checked By",    "checked_by"],
      ].map(([lbl, key]) => (
        <div key={key}>
          <span className="ws-tb-label">{lbl}</span>
          <input className="ws-tb-input" value={template[key] || ""} onChange={e => update(key, e.target.value)} />
        </div>
      ))}

      <div className="ws-tb-section">Notes</div>
      <span className="ws-tb-label">Important Notes</span>
      <textarea className="ws-tb-input ws-tb-textarea" value={template.important_notes || ""} onChange={e => update("important_notes", e.target.value)} />
      <span className="ws-tb-label">Material Core Notes</span>
      <textarea className="ws-tb-input ws-tb-textarea" value={template.material_notes || ""} onChange={e => update("material_notes", e.target.value)} />

      <div className="ws-tb-section">Approval Stamp</div>
      <span className="ws-tb-label">Stamp Text</span>
      <input className="ws-tb-input" value={template.approval_stamp_text || ""} onChange={e => update("approval_stamp_text", e.target.value)} />
      <span className="ws-tb-label">Approved By</span>
      <input className="ws-tb-input" value={template.approval_name || ""} onChange={e => update("approval_name", e.target.value)} />

      <button onClick={saveTemplate} disabled={saving} className="ws-tb-save-btn">
        {saving ? "Saving..." : saveMsg || "Save Template"}
      </button>

    </div>
  );
}

function PanelEmpty({ label, sub }) {
  return (
    <div className="ws-panel-empty">
      <div className="ws-panel-empty-icon">⬡</div>
      <div className="ws-panel-empty-label">{label}</div>
      {sub && <div className="ws-panel-empty-sub">{sub}</div>}
    </div>
  );
}

export default Workspace;