// ─────────────────────────────────────────────────────────────
// ProjectSetup.jsx
//
// Project-scoped setup popup. Structurally clones the Drawing
// Viewer shell (vw-* classes from ProjectsPage.css): same overlay,
// same 70vw x 82vh viewer, same draggable sidebar divider with the
// left/right scroll line, same 25% / 40% right-panel clamp.
//
// Layout:
//   header  → three MAIN tabs (Project Data / Material / Hardware)
//   body    → left  = dataset viewer (4-way scroll) for active sub-tab
//             right = add-material/hardware functionality panel
//   The sub-tab bar (13 material / 5 hardware) sits at the top of the
//   RIGHT portion, beside a matching-height dataset-viewer header bar.
//
// Tabs use the workspace .tab system (App.css) with the ‹ / ›
// overflow-scroll pattern from LeftPanel.jsx.
//
// SHELL ONLY: the dataset viewer shows a placeholder (Supabase is
// not yet loaded for these category tables), and the right panel's
// "Add" controls are structural — the project_materials scoping
// layer and real add logic are deferred.
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import { apiFetch } from "../api";
import "./ProjectSetup.css";

// ─── MAIN TABS ───────────────────────────────────────────────
const MAIN_TABS = [
  { id: "data",     label: "Project Data"     },
  { id: "material", label: "Project Material"  },
  { id: "hardware", label: "Project Hardware"  },
];

// ─── MATERIAL SUB-TABS (13) ──────────────────────────────────
const MATERIAL_SUBTABS = [
  { id: "laminates",      label: "Laminates"      },
  { id: "metal_laminates",label: "Metal Laminates"},
  { id: "veneer",         label: "Veneer"         },
  { id: "solids",         label: "Solids"         },
  { id: "metal_surfaces", label: "Metal Surfaces" },
  { id: "glass",          label: "Glass"          },
  { id: "mirror",         label: "Mirror"         },
  { id: "solid_surface",  label: "Solid Surface"  },
  { id: "stone",          label: "Stone"          },
  { id: "quartz",         label: "Quartz"         },
  { id: "core",           label: "Core"           },
  { id: "melamine",       label: "Melamine"       },
  { id: "edgebands",      label: "Edgebands"      },
];

// ─── HARDWARE SUB-TABS (first 5) ─────────────────────────────
const HARDWARE_SUBTABS = [
  { id: "hinges",         label: "Hinges"         },
  { id: "drawer_slides",  label: "Drawer Slides"  },
  { id: "handles_pulls",  label: "Handles / Pulls"},
  { id: "shelf_supports", label: "Shelf Supports" },
  { id: "fasteners",      label: "Fasteners"      },
];

// Column headers per category — the "general" main-table view.
// (Reference only for now; real rows come once Supabase is loaded.)
const CATEGORY_COLUMNS = {
  laminates: ["Code", "Finish #", "Finish Name", "Collection", "Grade", "Texture", "Thickness (mm)", "Sizes", "Fire", "MTO"],
  core:      ["Code", "Description", "Substrate", "Thickness (mm)", "FR", "LEED", "FSC", "Ext", "CARB"],
  melamine:  ["Code", "Finish", "Core", "Thickness (mm)", "Texture", "Grain", "Sides", "FR"],
  edgebands: ["Code", "Type", "Finish", "Width (mm)", "Thickness (mm)", "Matches"],
  _default:  ["Code", "Name", "Manufacturer", "Spec", "Thickness", "Notes"],
};

function columnsFor(subtabId) {
  return CATEGORY_COLUMNS[subtabId] || CATEGORY_COLUMNS._default;
}

// Real columns for laminates added to a project (live data, unlike the
// reference-only CATEGORY_COLUMNS above).
const LAMINATE_ROW_COLUMNS = [
  "Code", "Finish #", "Finish Name", "Manufacturer", "Collection",
  "Texture", "Grade", "Thickness (in / mm)", "Sizes", "",
];

function ProjectSetup({ project, onClose }) {

  // ── Main + sub tab state ─────────────────────────────────
  const [mainTab, setMainTab] = useState("data");
  const [materialSub, setMaterialSub] = useState(MATERIAL_SUBTABS[0].id);
  const [hardwareSub, setHardwareSub] = useState(HARDWARE_SUBTABS[0].id);

  const activeSubtabs = mainTab === "material" ? MATERIAL_SUBTABS
                      : mainTab === "hardware" ? HARDWARE_SUBTABS
                      : [];
  const activeSub = mainTab === "material" ? materialSub
                  : mainTab === "hardware" ? hardwareSub
                  : null;
  const setActiveSub = mainTab === "material" ? setMaterialSub : setHardwareSub;

  // ── Sub-tab overflow scroll (mirrors LeftPanel pattern) ──
  const subBarRef = useRef(null);
  const [subCanLeft,  setSubCanLeft]  = useState(false);
  const [subCanRight, setSubCanRight] = useState(false);

  const checkSubOverflow = useCallback(() => {
    const bar = subBarRef.current;
    if (!bar) return;
    setSubCanLeft(bar.scrollLeft > 0);
    setSubCanRight(bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const t = setTimeout(checkSubOverflow, 60);
    window.addEventListener("resize", checkSubOverflow);
    return () => { clearTimeout(t); window.removeEventListener("resize", checkSubOverflow); };
  }, [checkSubOverflow, mainTab]);

  // ── Right-panel (functionality) resize — clone of viewer ──
  const SIDEBAR_MIN = 25;
  const SIDEBAR_MAX = 40;
  const [sidebarPct, setSidebarPct]           = useState(30);
  const [sidebarDivHover, setSidebarDivHover]  = useState(false);
  const isSidebarDrag   = useRef(false);
  const sidebarDragX    = useRef(0);
  const sidebarDragPct  = useRef(30);
  const setupRef        = useRef(null);

  const onSidebarMouseMove = useCallback((e) => {
    if (!isSidebarDrag.current || !setupRef.current) return;
    const vw  = setupRef.current.getBoundingClientRect().width;
    const dx  = sidebarDragX.current - e.clientX;
    const pct = sidebarDragPct.current + (dx / vw) * 100;
    setSidebarPct(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, pct)));
  }, []);

  const onSidebarMouseUp = useCallback(() => {
    isSidebarDrag.current = false;
    setSidebarDivHover(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onSidebarMouseMove);
    window.addEventListener("mouseup",   onSidebarMouseUp);
    return () => {
      window.removeEventListener("mousemove", onSidebarMouseMove);
      window.removeEventListener("mouseup",   onSidebarMouseUp);
    };
  }, [onSidebarMouseMove, onSidebarMouseUp]);

  function onSidebarDividerDown(e) {
    e.preventDefault();
    isSidebarDrag.current  = true;
    sidebarDragX.current   = e.clientX;
    sidebarDragPct.current = sidebarPct;
  }

  // ── Esc to close ─────────────────────────────────────────
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── LAMINATES: search + add-to-project ────────────────────
  const isLaminatesTab = mainTab === "material" && materialSub === "laminates";

  const [lamManufacturers, setLamManufacturers] = useState([]);
  const [lamQuery,         setLamQuery]         = useState("");
  const [lamManufacturer,  setLamManufacturer]  = useState("");
  const [lamResults,       setLamResults]       = useState([]);
  const [lamSearching,     setLamSearching]     = useState(false);
  const [lamSelected,      setLamSelected]      = useState(null);
  const [lamCode,          setLamCode]          = useState("");
  const [lamAdding,        setLamAdding]        = useState(false);
  const [lamAdded,         setLamAdded]         = useState([]);
  const [lamAddedLoading,  setLamAddedLoading]  = useState(false);
  const [lamError,         setLamError]         = useState("");

  const loadProjectLaminates = useCallback(async () => {
    if (!project) return;
    setLamAddedLoading(true);
    try {
      const res = await apiFetch(`/projects/${project.id}/laminates`);
      const data = await res.json();
      if (res.ok) setLamAdded(data.laminates || []);
    } finally {
      setLamAddedLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (!isLaminatesTab) return;
    apiFetch("/laminates/manufacturers")
      .then(res => res.json())
      .then(data => setLamManufacturers(data.manufacturers || []))
      .catch(() => {});
    loadProjectLaminates();
  }, [isLaminatesTab, loadProjectLaminates]);

  // Debounced search-as-you-type — only fires once the user has given
  // the search something to narrow on (typed text or picked a
  // manufacturer). Opening the tab with no criteria shouldn't pull the
  // whole catalog.
  useEffect(() => {
    if (!isLaminatesTab) return;
    if (!lamQuery.trim() && !lamManufacturer) {
      setLamResults([]);
      setLamSearching(false);
      return;
    }
    setLamSearching(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (lamQuery.trim())     params.set("q", lamQuery.trim());
      if (lamManufacturer)     params.set("manufacturer", lamManufacturer);
      apiFetch(`/laminates/search?${params.toString()}`)
        .then(res => res.json())
        .then(data => setLamResults(data.results || []))
        .catch(() => setLamResults([]))
        .finally(() => setLamSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [isLaminatesTab, lamQuery, lamManufacturer]);

  async function handleAddLaminate() {
    if (!lamSelected || !project || !lamCode.trim()) return;
    setLamAdding(true);
    setLamError("");
    try {
      const res = await apiFetch(`/projects/${project.id}/laminates`, {
        method: "POST",
        body: JSON.stringify({ variant_id: lamSelected.variant_id, project_code: lamCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLamError(data.detail || "Could not add laminate");
        return;
      }
      setLamSelected(null);
      setLamCode("");
      await loadProjectLaminates();
    } finally {
      setLamAdding(false);
    }
  }

  async function handleRemoveLaminate(rowId) {
    if (!project) return;
    const res = await apiFetch(`/projects/${project.id}/laminates/${rowId}`, { method: "DELETE" });
    if (res.ok) setLamAdded(prev => prev.filter(r => r.id !== rowId));
  }

  const activeSubLabel = activeSubtabs.find(s => s.id === activeSub)?.label || "";

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="vw-overlay">
      <div className="vw-viewer ps-viewer" ref={setupRef}>

        {/* ═══ HEADER — main tabs + identity + close ═══ */}
        <div className="vw-header ps-header">
          <div className="ps-header-tabs">
            {MAIN_TABS.map(t => (
              <button
                key={t.id}
                className={`tab${mainTab === t.id ? " active" : ""}`}
                onClick={() => setMainTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="ps-header-right">
            {project && (
              <span className="ps-header-project">
                <span className="ps-header-jobnum">{project.job_number}</span>
                {project.job_number && <span className="vw-header-sep">·</span>}
                <span className="ps-header-pname">{project.project_name}</span>
              </span>
            )}
            <button className="vw-close-btn" onClick={onClose} title="Close setup">✕</button>
          </div>
        </div>

        {/* ═══ BODY ═══ */}
        <div className="vw-body">

          {/* ── LEFT: dataset viewer ── */}
          <div className="vw-canvas-col ps-dataset-col">

            {/* dataset header bar — matches sub-tab bar height (38px) */}
            <div className="ps-dataset-header">
              {mainTab === "data"
                ? <span className="ps-dataset-title">Project Data</span>
                : <span className="ps-dataset-title">{activeSubLabel}</span>}
            </div>

            {/* dataset body — 4-way scroll */}
            <div className="ps-dataset-body">
              {mainTab === "data" ? (
                <div className="ps-placeholder">
                  <div className="ps-placeholder-glyph">⬡</div>
                  <div className="ps-placeholder-title">Project Data</div>
                  <div className="ps-placeholder-text">
                    Default sizes and construction assumptions for this project.
                    Coming soon.
                  </div>
                </div>
              ) : isLaminatesTab ? (
                <LaminateDatasetTable
                  rows={lamAdded}
                  loading={lamAddedLoading}
                  onRemove={handleRemoveLaminate}
                />
              ) : (
                <DatasetTable columns={columnsFor(activeSub)} categoryLabel={activeSubLabel} />
              )}
            </div>
          </div>

          {/* ── DIVIDER (clone of viewer sidebar divider) ── */}
          {mainTab !== "data" && (
            <div
              className={`vw-sidebar-divider${sidebarDivHover ? " vw-sidebar-divider--active" : ""}`}
              onMouseDown={onSidebarDividerDown}
              onMouseEnter={() => setSidebarDivHover(true)}
              onMouseLeave={() => setSidebarDivHover(false)}
            />
          )}

          {/* ── RIGHT: sub-tabs + functionality ── */}
          {mainTab !== "data" && (
            <div className="vw-sidebar ps-func" style={{ width: `${sidebarPct}%` }}>

              {/* sub-tab bar — workspace .tab system + overflow scroll */}
              <div className="tab-bar-wrapper ps-subtab-bar">
                <button
                  className="tab-scroll-btn"
                  onClick={() => subBarRef.current?.scrollBy({ left: -100, behavior: "smooth" })}
                  style={{ opacity: subCanLeft ? 1 : 0.25, pointerEvents: subCanLeft ? "auto" : "none" }}
                >‹</button>

                <div className="tab-bar" ref={subBarRef} onScroll={checkSubOverflow}>
                  {activeSubtabs.map(s => (
                    <button
                      key={s.id}
                      className={`tab${activeSub === s.id ? " active" : ""}`}
                      onClick={() => setActiveSub(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <button
                  className="tab-scroll-btn"
                  onClick={() => subBarRef.current?.scrollBy({ left: 100, behavior: "smooth" })}
                  style={{ opacity: subCanRight ? 1 : 0.25, pointerEvents: subCanRight ? "auto" : "none" }}
                >›</button>
              </div>

              {/* functionality body */}
              <div className="ps-func-body">
                <div className="ps-func-section">ADD TO {activeSubLabel.toUpperCase()}</div>

                <label className="ps-func-label">Search Global Library</label>
                <input
                  className="ps-func-input"
                  placeholder={`Search ${activeSubLabel}...`}
                  value={isLaminatesTab ? lamQuery : ""}
                  onChange={isLaminatesTab ? (e => setLamQuery(e.target.value)) : undefined}
                  disabled={!isLaminatesTab}
                />

                <label className="ps-func-label">Manufacturer</label>
                <select
                  className="ps-func-input"
                  value={isLaminatesTab ? lamManufacturer : ""}
                  onChange={isLaminatesTab ? (e => setLamManufacturer(e.target.value)) : undefined}
                  disabled={!isLaminatesTab}
                >
                  <option value="">— Any —</option>
                  {isLaminatesTab && lamManufacturers.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {isLaminatesTab && (
                  <LaminateResultsList
                    results={lamResults}
                    loading={lamSearching}
                    selected={lamSelected}
                    onSelect={setLamSelected}
                    hasQuery={!!(lamQuery.trim() || lamManufacturer)}
                  />
                )}

                {isLaminatesTab && lamSelected && (
                  <>
                    <label className="ps-func-label">Project Code</label>
                    <input
                      className="ps-func-input"
                      placeholder="e.g. PL-01"
                      value={lamCode}
                      onChange={e => setLamCode(e.target.value)}
                    />
                    <div className="ps-func-hint">
                      Identifies this material on drawings for this project only.
                      Entered by you — not assigned automatically.
                    </div>
                  </>
                )}

                {isLaminatesTab && lamError && (
                  <div className="ps-func-hint" style={{ color: "var(--danger, #e05555)" }}>{lamError}</div>
                )}

                <button
                  className="ps-func-add"
                  disabled={isLaminatesTab ? (!lamSelected || !lamCode.trim() || lamAdding) : true}
                  onClick={isLaminatesTab ? handleAddLaminate : undefined}
                >
                  {lamAdding ? "Adding…" : `+ Add to ${activeSubLabel}`}
                </button>

                <div className="ps-func-divider" />

                <div className="ps-func-section">NEW MATERIAL</div>
                <div className="ps-func-hint">
                  Submit a material not in the library. Goes to review before
                  it joins the global catalog.
                </div>
                <button className="ps-func-add ps-func-add--ghost" disabled>
                  + Submit New Material
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── DATASET TABLE (shell — placeholder rows) ────────────────
function DatasetTable({ columns, categoryLabel }) {
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>
            {columns.map(c => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr className="ps-table-empty-row">
            <td colSpan={columns.length}>
              <div className="ps-table-empty">
                <div className="ps-placeholder-glyph">⬡</div>
                <div className="ps-placeholder-title">No {categoryLabel} in this project</div>
                <div className="ps-placeholder-text">
                  Add {categoryLabel.toLowerCase()} from the panel on the right.
                  Catalog data is not loaded yet.
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── LAMINATE SEARCH RESULTS (right panel) ────────────────────
function LaminateResultsList({ results, loading, selected, onSelect, hasQuery }) {
  if (!hasQuery) {
    return <div className="ps-lam-results-idle">Type a finish name/code or pick a manufacturer to search.</div>;
  }
  return (
    <div className="ps-lam-results">
      {loading ? (
        <div className="ps-lam-results-hint">Searching…</div>
      ) : results.length === 0 ? (
        <div className="ps-lam-results-hint">No matches</div>
      ) : (
        results.map(r => (
          <button
            key={r.variant_id}
            className={`ps-lam-result${selected?.variant_id === r.variant_id ? " selected" : ""}`}
            onClick={() => onSelect(r)}
            type="button"
          >
            <div className="ps-lam-result-title">
              {r.finish_code} — {r.finish_name}
            </div>
            <div className="ps-lam-result-sub">
              {r.manufacturer}{r.collection ? ` · ${r.collection}` : ""}
              {r.texture_name ? ` · ${r.texture_name}` : ""}
              {r.grade_code ? ` · Grade ${r.grade_code}` : ""}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ─── LAMINATES ADDED TO PROJECT (left dataset table) ──────────
function LaminateDatasetTable({ rows, loading, onRemove }) {
  if (loading) {
    return (
      <div className="ps-table-empty">
        <div className="ps-placeholder-title">Loading…</div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>{LAMINATE_ROW_COLUMNS.map(c => <th key={c || "_actions"}>{c}</th>)}</tr>
          </thead>
          <tbody>
            <tr className="ps-table-empty-row">
              <td colSpan={LAMINATE_ROW_COLUMNS.length}>
                <div className="ps-table-empty">
                  <div className="ps-placeholder-glyph">⬡</div>
                  <div className="ps-placeholder-title">No Laminates in this project</div>
                  <div className="ps-placeholder-text">
                    Search the global library on the right and add a finish to get started.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>{LAMINATE_ROW_COLUMNS.map(c => <th key={c || "_actions"}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.project_code}</td>
              <td>{r.finish_code}</td>
              <td>{r.finish_name}</td>
              <td>{r.manufacturer}</td>
              <td>{r.collection}</td>
              <td>{r.texture_name}</td>
              <td>{r.grade_code}</td>
              <td>{r.thickness_in ?? "—"} / {r.thickness_mm ?? "—"}</td>
              <td>{(r.sizes || []).join(", ")}</td>
              <td>
                <button className="ps-lam-remove" onClick={() => onRemove(r.id)} title="Remove from project">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProjectSetup;
