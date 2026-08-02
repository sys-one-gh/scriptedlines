// ─────────────────────────────────────────────────────────────
// DrawingExplorer.jsx
//
// The toolbar above the drawing list: selected-project identity
// on the left, search/sort/view-toggle/Setup/+New Drawing on the
// right. Archived-state gating for "+ New Drawing" happens in the
// orchestrator's onNewDrawing callback, not here — it needs to
// touch the archived-notice dialog, which this component doesn't
// know about.
// ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "drawing_number", label: "Drawing #" },
  { value: "title",          label: "Drawing Name" },
  { value: "mw_number",      label: "MW#" },
  { value: "level",          label: "Level" },
  { value: "status",         label: "Status" },
];

function DrawingExplorer({
  selectedProject, drawingSearch, setDrawingSearch,
  sortField, setSortField, sortDir, setSortDir,
  viewMode, setViewMode, onOpenSetup, onNewDrawing,
}) {
  return (
    <div className="pp-explorer-bar">
      <div className="pp-explorer-bar-left">
        <div className="pp-explorer-bar-line1">
          {selectedProject.job_number && <>
            <span className="pp-dbar-jobnum pp-dbar-jobnum--blue">{selectedProject.job_number}</span>
            <span className="pp-dbar-sep">—</span>
          </>}
          <span className="pp-project-name pp-project-name--blue">{selectedProject.project_name}</span>
        </div>
        <div className="pp-explorer-bar-line2">
          {selectedProject.project_grade && <span className="pp-spec-badge">{selectedProject.project_grade}</span>}
          {selectedProject.standard      && <span className="pp-spec-badge pp-spec-badge--blue">{selectedProject.standard}</span>}
          {selectedProject.compliance_leed && <span className="pp-spec-badge pp-spec-badge--green">LEED</span>}
          {selectedProject.compliance_fsc  && <span className="pp-spec-badge pp-spec-badge--green">FSC</span>}
          {selectedProject.compliance_fr   && <span className="pp-spec-badge pp-spec-badge--red">FR</span>}
        </div>
      </div>

      <div className="pp-explorer-bar-right">
        <div className="pp-search-wrap">
          <span className="pp-search-icon">⌕</span>
          <input className="pp-search-input" type="text" placeholder="Search..."
            value={drawingSearch} onChange={e => setDrawingSearch(e.target.value)} />
        </div>
        <span className="pp-sort-label">Sort:</span>
        <select className="pp-sort-select"
          value={sortField}
          onChange={e => { setSortField(e.target.value); setSortDir("asc"); }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="pp-sort-dir-btn" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}>
          {sortDir === "asc" ? "↑" : "↓"}
        </button>
        <div className="pp-view-toggle">
          <button className={`pp-view-btn${viewMode === "card" ? " pp-view-btn--active" : ""}`} onClick={() => setViewMode("card")} title="Card view">⊞</button>
          <button className={`pp-view-btn${viewMode === "list" ? " pp-view-btn--active" : ""}`} onClick={() => setViewMode("list")} title="List view">≡</button>
        </div>
        <button className="pp-btn-setup" onClick={onOpenSetup} title="Project setup — materials, hardware, defaults">
          ⚙ Project Setup
        </button>
        <button className="pp-btn-newdwg" onClick={onNewDrawing}>+ New Drawing</button>
      </div>
    </div>
  );
}

export default DrawingExplorer;
