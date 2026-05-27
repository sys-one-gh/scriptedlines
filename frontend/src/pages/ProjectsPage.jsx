import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000/api";
const GRADES    = ["Custom", "Premium", "Standard", "Commercial", "Institutional"];
const STANDARDS = ["AWMAC", "AWI", "WI"];
const SCALES    = ["1:4", "1:10", "1:20", "1:50", "1:100", "As Noted"];
const PAPER_SIZES = ["Arch_D", "Arch_E"];
const AVATARS   = ["🏛", "📐", "📏", "🔩", "🪚", "⚙️", "🔧", "🏗", "✏️", "📋"];

const STATUS_COLORS = {
  draft:    { bg: "#1a1a1a", color: "#888",    border: "#2a2a2a", dot: "#555" },
  review:   { bg: "#221a00", color: "#e6a817", border: "#4a3800", dot: "#e6a817" },
  approved: { bg: "#0a1f0a", color: "#4caf50", border: "#1a4a1a", dot: "#4caf50" },
  issued:   { bg: "#0a1525", color: "#4f8ef7", border: "#1a3a6a", dot: "#4f8ef7" },
};

const SECTIONS = ["Identity", "Team", "Client", "Job Site", "Schedule"];

// Drawing number validation: D + 4 digits
function validateDrawingNumber(val) {
  return /^D[0-9]{4}$/.test(val.toUpperCase());
}

function ProjectsPage() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem("sl_user") || "{}");

  // ── Left panel resize ──────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(20);
  const LEFT_MIN = 15; const LEFT_MAX = 25;
  const isDragging   = useRef(false);
  const dragStartX   = useRef(0);
  const dragStartW   = useRef(0);
  const containerRef = useRef(null);

  function onDividerDown(e) {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = leftWidth;
  }
  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return;
    const cw = containerRef.current.getBoundingClientRect().width;
    const dx = e.clientX - dragStartX.current;
    setLeftWidth(Math.min(Math.max(dragStartW.current + (dx / cw) * 100, LEFT_MIN), LEFT_MAX));
  }, []);
  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);
  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [onMouseMove, onMouseUp]);

  // ── Data ──────────────────────────────────────────────────
  const [activeProjects,   setActiveProjects]   = useState([]);
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [selectedProject,  setSelectedProject]  = useState(null);
  const [drawings,         setDrawings]         = useState([]);
  const [loadingProjects,  setLoadingProjects]  = useState(true);
  const [loadingDrawings,  setLoadingDrawings]  = useState(false);
  const [viewMode,         setViewMode]         = useState("card");
  const [projectTab,       setProjectTab]       = useState("active"); // active | archived
  const [drawingSearch,    setDrawingSearch]    = useState("");

  // ── UI state ──────────────────────────────────────────────
  const [showNewProject,   setShowNewProject]   = useState(false);
  const [showNewDrawing,   setShowNewDrawing]   = useState(false);
  const [showUserMenu,     setShowUserMenu]     = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [projectMenuId,    setProjectMenuId]    = useState(null); // which project's ⋯ is open
  const [editingProject,   setEditingProject]   = useState(null); // project being edited
  const [userAvatar,       setUserAvatar]       = useState(localStorage.getItem("sl_avatar") || "🏛");

  // ── Project form ──────────────────────────────────────────
  const emptyProject = {
    project_name:"", job_number:"", description:"",
    project_grade:"", standard:"",
    drawn_by:"", checked_by:"", project_manager:"", draftsman:"",
    architect_name:"", estimator_name:"", contractor_name:"",
    client_name:"", client_address:"", client_phone:"", client_fax:"", client_email:"",
    jobsite_name:"", jobsite_address:"", jobsite_phone:"", jobsite_fax:"", jobsite_email:"",
    scheduled_start_date:"", scheduled_completion_date:"", project_budget:"",
    compliance_leed: false, compliance_fsc: false, compliance_fr: false,
  };
  const [pForm,    setPForm]    = useState(emptyProject);
  const [pSection, setPSection] = useState(0);
  const [pError,   setPError]   = useState("");
  const [pLoading, setPLoading] = useState(false);

  // ── Drawing form ──────────────────────────────────────────
  const emptyDrawing = { drawing_number:"", mw_number:"", title:"", scale:"1:20", paper_size:"Arch_D", level:"", location:"", arch_ref:"", item_description:"" };
  const [dForm,    setDForm]    = useState(emptyDrawing);
  const [dError,   setDError]   = useState("");
  const [dLoading, setDLoading] = useState(false);

  // ── Refs for outside click ────────────────────────────────
  const userMenuRef    = useRef(null);
  const projectMenuRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (userMenuRef.current    && !userMenuRef.current.contains(e.target))    setShowUserMenu(false);
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target)) setProjectMenuId(null);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── Load on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!user.id) { navigate("/login"); return; }
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      const res  = await fetch(`${API}/projects?company_id=${user.company_id}`);
      const data = await res.json();
      const groups = data.groups || [];
      setActiveProjects(  groups.find(g => g.label === "Active")?.projects   || []);
      setArchivedProjects(groups.find(g => g.label === "Archived")?.projects || []);
    } catch { setActiveProjects([]); setArchivedProjects([]); }
    setLoadingProjects(false);
  }

  async function loadDrawings(pid) {
    setLoadingDrawings(true); setDrawings([]);
    try {
      const res  = await fetch(`${API}/drawings/project/${pid}`);
      const data = await res.json();
      setDrawings(data.drawings || []);
    } catch { setDrawings([]); }
    setLoadingDrawings(false);
  }

  function selectProject(p) {
    setSelectedProject(p);
    setDrawingSearch("");
    setProjectMenuId(null);
    loadDrawings(p.id);
  }

  function signOut() { localStorage.removeItem("sl_user"); navigate("/login"); }
  function pickAvatar(a) { setUserAvatar(a); localStorage.setItem("sl_avatar", a); setShowAvatarPicker(false); }

  // ── Create project ────────────────────────────────────────
  async function createProject(e) {
    e.preventDefault();
    if (!pForm.project_name.trim()) { setPError("Project name is required."); return; }
    setPLoading(true); setPError("");
    try {
      const url    = editingProject ? `${API}/projects/${editingProject.id}` : `${API}/projects`;
      const method = editingProject ? "PUT" : "POST";
      const body   = {
        company_id: user.company_id, created_by: user.id,
        ...pForm,
        project_grade: pForm.project_grade || null,
        standard:      pForm.standard      || null,
        scheduled_start_date:      pForm.scheduled_start_date      || null,
        scheduled_completion_date: pForm.scheduled_completion_date || null,
        project_budget: pForm.project_budget ? parseFloat(pForm.project_budget) : null,
        compliance_leed: pForm.compliance_leed,
        compliance_fsc:  pForm.compliance_fsc,
        compliance_fr:   pForm.compliance_fr,
      };
      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setPError(data.detail || "Failed."); setPLoading(false); return; }
      setShowNewProject(false); setEditingProject(null);
      setPForm(emptyProject); setPSection(0); setPError("");
      await loadProjects();
      if (!editingProject) selectProject(data.project);
    } catch { setPError("Could not connect to server."); }
    setPLoading(false);
  }

  function openEditProject(p) {
    setEditingProject(p);
    setPForm({
      project_name:   p.project_name   || "",
      job_number:     p.job_number     || "",
      description:    p.description    || "",
      project_grade:  p.project_grade  || "",
      standard:       p.standard       || "",
      drawn_by:       p.drawn_by       || "",
      checked_by:     p.checked_by     || "",
      project_manager:p.project_manager|| "",
      draftsman:      p.draftsman      || "",
      architect_name: p.architect_name || "",
      estimator_name: p.estimator_name || "",
      contractor_name:p.contractor_name|| "",
      client_name:    p.client_name    || "",
      client_address: p.client_address || "",
      client_phone:   p.client_phone   || "",
      client_fax:     p.client_fax     || "",
      client_email:   p.client_email   || "",
      jobsite_name:    p.jobsite_name    || "",
      jobsite_address: p.jobsite_address || "",
      jobsite_phone:   p.jobsite_phone   || "",
      jobsite_fax:     p.jobsite_fax     || "",
      jobsite_email:   p.jobsite_email   || "",
      scheduled_start_date:      p.scheduled_start_date      || "",
      scheduled_completion_date: p.scheduled_completion_date || "",
      project_budget: p.project_budget ? String(p.project_budget) : "",
      compliance_leed: p.compliance_leed || false,
      compliance_fsc:  p.compliance_fsc  || false,
      compliance_fr:   p.compliance_fr   || false,
    });
    setPSection(0); setPError("");
    setShowNewProject(true);
    setProjectMenuId(null);
  }

  async function deleteProject(id) {
    setProjectMenuId(null);
    await fetch(`${API}/projects/${id}`, { method: "DELETE" });
    if (selectedProject?.id === id) setSelectedProject(null);
    await loadProjects();
  }

  // ── Create drawing ────────────────────────────────────────
  async function createDrawing(e) {
    e.preventDefault();
    if (!dForm.drawing_number.trim()) { setDError("Drawing number is required."); return; }
    if (!validateDrawingNumber(dForm.drawing_number)) {
      setDError("Drawing number must be D followed by exactly 4 digits (e.g. D9501). Page numbers use decimal notation: D9501.01");
      return;
    }
    if (!dForm.title.trim()) { setDError("Title is required."); return; }
    setDLoading(true); setDError("");
    try {
      const res  = await fetch(`${API}/drawings`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: selectedProject.id, created_by: user.id, ...dForm,
          drawing_number: dForm.drawing_number.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setDError(data.detail || "Failed."); setDLoading(false); return; }
      setShowNewDrawing(false); setDForm(emptyDrawing); setDError("");
      await loadDrawings(selectedProject.id);
    } catch { setDError("Could not connect."); }
    setDLoading(false);
  }

  async function deleteDrawing(id) {
    await fetch(`${API}/drawings/${id}`, { method: "DELETE" });
    await loadDrawings(selectedProject.id);
  }

  function openDrawing(d) {
    localStorage.setItem("sl_drawing", JSON.stringify(d));
    localStorage.setItem("sl_project", JSON.stringify(selectedProject));
    navigate("/workspace");
  }

  const filtered = drawings.filter(d =>
    d.drawing_number.toLowerCase().includes(drawingSearch.toLowerCase()) ||
    d.title.toLowerCase().includes(drawingSearch.toLowerCase())
  );

  const displayedProjects = projectTab === "active" ? activeProjects : archivedProjects;

  // ── Drawing number input handler — auto uppercase ─────────
  function handleDrawingNumberInput(e) {
    let val = e.target.value.toUpperCase().replace(/[^D0-9]/g, "");
    if (val.length > 0 && val[0] !== "D") val = "D" + val.replace(/D/g, "");
    if (val.length > 5) val = val.slice(0, 5);
    setDForm({ ...dForm, drawing_number: val });
    setDError("");
  }

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div style={S.page} ref={containerRef}>

      {/* ════ TOP BAR ════════════════════════════════════════ */}
      <div style={S.topBar}>

        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoMark}><span style={S.logoMarkText}>SL</span></div>
          <div style={S.logoWords}>
            <span style={S.logoMain}>ScriptedLines</span>
            <span style={S.logoSub}>MILLWORK STUDIO</span>
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={S.topCenter}>
          {selectedProject ? (
            <div style={S.breadcrumb}>
              <span style={S.breadcrumbRoot}>Projects Space</span>
              <span style={S.breadcrumbSep}>›</span>
              <span style={S.breadcrumbCurrent}>{selectedProject.project_name}</span>
              <span style={S.breadcrumbSep}>·</span>
              <span style={S.breadcrumbMeta}>#{selectedProject.project_number}</span>
              {selectedProject.job_number && <>
                <span style={S.breadcrumbSep}>·</span>
                <span style={S.breadcrumbMeta}>Job# {selectedProject.job_number}</span>
              </>}
            </div>
          ) : (
            <span style={S.breadcrumbRoot}>Projects Space</span>
          )}
        </div>

        {/* Right */}
        <div style={S.topRight}>
          <div style={S.autosave}>
            <div style={{ ...S.autosaveDot, background: "#4caf50" }} />
            <span>Saved</span>
          </div>

          <button style={S.iconBtn} title="Notifications">🔔</button>

          {/* User menu */}
          <div style={{ position: "relative" }} ref={userMenuRef}>
            <button style={S.avatarBtn} onClick={() => { setShowUserMenu(!showUserMenu); setShowAvatarPicker(false); }}>
              <span style={{ fontSize: "18px" }}>{userAvatar}</span>
            </button>
            {showUserMenu && (
              <div style={S.userMenu}>
                <div style={S.userMenuHeader}>
                  <div style={{ fontSize: "28px" }}>{userAvatar}</div>
                  <div>
                    <div style={S.userMenuName}>{user.first_name} {user.last_name}</div>
                    <div style={S.userMenuRole}>{user.role}</div>
                  </div>
                </div>
                <div style={S.menuDivider} />
                <button style={S.menuItem} onClick={() => { setShowAvatarPicker(true); setShowUserMenu(false); }}>🖼  Change Avatar</button>
                <button style={S.menuItem}>👤  Account Settings</button>
                <button style={S.menuItem}>⚙️  Company Settings</button>
                <button style={S.menuItem}>💳  Manage Subscription</button>
                <div style={S.menuDivider} />
                <button style={{ ...S.menuItem, color: "#f47070" }} onClick={signOut}>→  Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════ BODY ════════════════════════════════════════════ */}
      <div style={S.body}>

        {/* ── LEFT PANEL ─────────────────────────────────── */}
        <div style={{ ...S.leftPanel, width: `${leftWidth}%` }}>

          {/* Header */}
          <div style={S.explorerHeader}>
            <span style={S.explorerTitle}>PROJECT EXPLORER</span>
            <button
              style={S.explorerAddBtn}
              title="New Project"
              onClick={() => { setShowNewProject(true); setEditingProject(null); setPForm(emptyProject); setPSection(0); setPError(""); }}
            >
              + New
            </button>
          </div>

          {/* Tabs — Active / Archived — same as workspace tab bar */}
          <div style={S.projectTabBar}>
            <button
              style={{ ...S.projectTab, ...(projectTab === "active" ? S.projectTabActive : {}) }}
              onClick={() => setProjectTab("active")}
            >
              Active
              {activeProjects.length > 0 && <span style={S.tabCount}>{activeProjects.length}</span>}
            </button>
            <button
              style={{ ...S.projectTab, ...(projectTab === "archived" ? S.projectTabActive : {}) }}
              onClick={() => setProjectTab("archived")}
            >
              Archived
              {archivedProjects.length > 0 && <span style={S.tabCount}>{archivedProjects.length}</span>}
            </button>
          </div>

          {/* Project list */}
          <div style={S.explorerList}>
            {loadingProjects ? (
              <div style={S.placeholder}>Loading...</div>
            ) : displayedProjects.length === 0 ? (
              <div style={S.placeholder}>
                {projectTab === "active" ? "No active projects." : "No archived projects."}
                {projectTab === "active" && (
                  <button style={S.inlineBtn} onClick={() => { setShowNewProject(true); setEditingProject(null); setPForm(emptyProject); setPSection(0); setPError(""); }}>
                    + Create first project
                  </button>
                )}
              </div>
            ) : (
              displayedProjects.map(p => {
                const active = selectedProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    style={{ ...S.projectRow, ...(active ? S.projectRowActive : {}) }}
                    onClick={() => selectProject(p)}
                  >
                    <div style={{ ...S.healthDot, background: p.drawing_count > 0 ? "#4caf50" : "#333" }} />
                    <div style={S.projectRowBody}>
                      <div style={{ ...S.projectRowName, color: active ? "#ffffff" : "#e0e0e0" }}>
                        {p.project_name}
                      </div>
                      <div style={S.projectRowMeta}>
                        #{p.project_number}
                        {p.job_number && ` · Job# ${p.job_number}`}
                        {p.drawing_count > 0 && ` · ${p.drawing_count} dwg`}
                      </div>
                    </div>

                    {/* ⋯ project menu */}
                    <div style={{ position: "relative" }} ref={projectMenuId === p.id ? projectMenuRef : null}>
                      <button
                        style={S.projectMenuBtn}
                        title="Project options"
                        onClick={(e) => { e.stopPropagation(); setProjectMenuId(projectMenuId === p.id ? null : p.id); }}
                      >
                        ⋯
                      </button>
                      {projectMenuId === p.id && (
                        <div style={S.projectPopover} onClick={e => e.stopPropagation()}>
                          <button style={S.popoverItem} onClick={() => openEditProject(p)}>
                            ✏️  Edit Project
                          </button>
                          <div style={S.menuDivider} />
                          <button style={{ ...S.popoverItem, color: "#f47070" }} onClick={() => deleteProject(p.id)}>
                            🗑  Delete Project
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── DIVIDER ─────────────────────────────────────── */}
        <div style={S.divider} onMouseDown={onDividerDown} />

        {/* ── MAIN AREA ───────────────────────────────────── */}
        <div style={S.mainArea}>

          {!selectedProject ? (
            <div style={S.emptyState}>
              <div style={S.emptyGlyph}>⬡</div>
              <div style={S.emptyTitle}>No Project Selected</div>
              <div style={S.emptyText}>Select a project from the explorer or create a new one.</div>
              <button style={S.primaryBtn} onClick={() => { setShowNewProject(true); setEditingProject(null); setPForm(emptyProject); setPSection(0); setPError(""); }}>
                + New Project
              </button>
            </div>
          ) : (
            <>
              {/* Project header */}
              <div style={S.projectHeader}>
                <div style={S.projectHeaderLeft}>
                  <div style={S.projectName}>{selectedProject.project_name}</div>
                  <div style={S.projectTags}>
                    <span style={S.tag}>#{selectedProject.project_number}</span>
                    {selectedProject.job_number    && <span style={S.tag}>Job# {selectedProject.job_number}</span>}
                    {selectedProject.client_name   && <span style={S.tag}>{selectedProject.client_name}</span>}
                    {selectedProject.project_grade && <span style={S.tag}>{selectedProject.project_grade}</span>}
                    {selectedProject.standard      && <span style={S.tag}>{selectedProject.standard}</span>}
                  </div>
                </div>
                <div style={S.projectHeaderRight}>
                  {/* Search */}
                  <div style={S.searchWrap}>
                    <span style={S.searchIcon}>⌕</span>
                    <input
                      type="text"
                      placeholder="Search drawings..."
                      value={drawingSearch}
                      onChange={e => setDrawingSearch(e.target.value)}
                      style={S.searchInput}
                    />
                  </div>
                  {/* View toggle */}
                  <div style={S.viewToggle}>
                    <button style={{ ...S.viewBtn, ...(viewMode === "card" ? S.viewBtnActive : {}) }} onClick={() => setViewMode("card")} title="Card view">⊞</button>
                    <button style={{ ...S.viewBtn, ...(viewMode === "list" ? S.viewBtnActive : {}) }} onClick={() => setViewMode("list")} title="List view">≡</button>
                  </div>
                  <button style={S.outlineBtn} onClick={() => { setShowNewDrawing(true); setDForm(emptyDrawing); setDError(""); }}>
                    + New Drawing
                  </button>
                </div>
              </div>

              {/* Drawings Explorer */}
              <div style={S.drawingsExplorerBar}>
                <span style={S.drawingsExplorerTitle}>DRAWINGS EXPLORER</span>
              </div>
              {loadingDrawings ? (
                <div style={S.placeholder}>Loading drawings...</div>
              ) : filtered.length === 0 ? (
                <div style={S.emptyState}>
                  <div style={S.emptyGlyph}>⬡</div>
                  <div style={S.emptyTitle}>No Drawings Yet</div>
                  <div style={S.emptyText}>Create the first drawing for this project.</div>
                  <button style={S.primaryBtn} onClick={() => { setShowNewDrawing(true); setDForm(emptyDrawing); setDError(""); }}>
                    + New Drawing
                  </button>
                </div>
              ) : viewMode === "card" ? (

                /* CARD VIEW */
                <div style={S.cardsGrid}>
                  {filtered.map(d => {
                    const sc = STATUS_COLORS[d.status] || STATUS_COLORS.draft;
                    return (
                      <div key={d.id} style={S.card}>
                        {/* Thumbnail */}
                        <div style={S.thumbnail}>
                          <div style={S.thumbnailGrid} />
                          <div style={S.thumbnailContent}>
                            <div style={S.thumbnailNumber}>{d.drawing_number}</div>
                            {d.mw_number && <div style={S.thumbnailMW}>MW# {d.mw_number}</div>}
                            <div style={S.thumbnailTitle}>{d.title}</div>
                          </div>
                          <div style={{ ...S.thumbnailStatus, background: sc.bg, color: sc.color, borderColor: sc.border }}>
                            <div style={{ ...S.statusDot, background: sc.dot }} />
                            {d.status}
                          </div>
                        </div>
                        {/* Card info */}
                        <div style={S.cardBody}>
                          <div style={S.cardNumber}>{d.drawing_number}</div>
                          <div style={S.cardTitle}>{d.title}</div>
                          <div style={S.cardMeta}>
                            {[d.scale, d.level && `Lv ${d.level}`, `Rev ${d.revision}`, `Pg ${d.page_number}/${d.total_pages}`].filter(Boolean).join("  ·  ")}
                          </div>
                        </div>
                        {/* Action bar */}
                        <div style={S.cardActions}>
                          <button style={S.actOpen}   onClick={() => openDrawing(d)}>Open</button>
                          <button style={S.actBtn}    title="Add revision">+ Rev</button>
                          <button style={S.actBtn}    title="View">View</button>
                          <button style={S.actBtn}    title="Export">Export</button>
                          <button style={S.actBtn}    title="BOM">BOM</button>
                          <button style={{ ...S.actBtn, color: "#f47070" }} title="Delete" onClick={() => deleteDrawing(d.id)}>🗑</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              ) : (

                /* LIST VIEW */
                <div style={S.listWrap}>
                  <div style={S.listHeader}>
                      <span style={{ ...S.listCol, flex: 1.2 }}>Drawing #</span>
                    <span style={S.listCol}>MW#</span>
                    <span style={{ ...S.listCol, flex: 1.5 }}>Title</span>
                    <span style={S.listCol}>Status</span>
                    <span style={S.listCol}>Scale</span>
                    <span style={S.listCol}>Rev</span>
                    <span style={S.listCol}>Page</span>
                    <span style={{ ...S.listCol, flex: 2 }}>Actions</span>
                  </div>
                  {filtered.map(d => {
                    const sc = STATUS_COLORS[d.status] || STATUS_COLORS.draft;
                    return (
                      <div key={d.id} style={S.listRow}>
                        <span style={{ ...S.listCell, flex: 1.2, color: "#4f8ef7", fontWeight: "700", fontFamily: "'IBM Plex Sans', monospace" }}>{d.drawing_number}</span>
                        <span style={{ ...S.listCell, fontFamily: "'IBM Plex Sans', monospace" }}>{d.mw_number || "—"}</span>
                        <span style={{ ...S.listCell, flex: 1.5 }}>{d.title}</span>
                        <span style={S.listCell}>
                          <span style={{ ...S.statusBadge, background: sc.bg, color: sc.color, borderColor: sc.border }}>
                            <div style={{ ...S.statusDot, background: sc.dot }} />{d.status}
                          </span>
                        </span>
                        <span style={S.listCell}>{d.scale}</span>
                        <span style={S.listCell}>{d.revision}</span>
                        <span style={S.listCell}>{d.page_number}/{d.total_pages}</span>
                        <span style={{ ...S.listCell, flex: 2 }}>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button style={S.actOpen}  onClick={() => openDrawing(d)}>Open</button>
                            <button style={S.actBtn}   title="Add revision">+ Rev</button>
                            <button style={S.actBtn}   title="View">View</button>
                            <button style={S.actBtn}   title="Export">Export</button>
                            <button style={S.actBtn}   title="BOM">BOM</button>
                            <button style={{ ...S.actBtn, color: "#f47070" }} title="Delete" onClick={() => deleteDrawing(d.id)}>🗑</button>
                          </div>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════ AVATAR PICKER ══════════════════════════════════ */}
      {showAvatarPicker && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: "380px" }}>
            <div style={S.modalHeader}>
              <div style={S.modalTitle}>Choose Avatar</div>
              <button style={S.closeBtn} onClick={() => setShowAvatarPicker(false)}>✕</button>
            </div>
            <div style={{ padding: "28px", display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center" }}>
              {AVATARS.map(a => (
                <button key={a} onClick={() => pickAvatar(a)} style={{
                  width: "56px", height: "56px",
                  background: userAvatar === a ? "#1a3a6a" : "#1e1e1e",
                  border: userAvatar === a ? "2px solid #4f8ef7" : "2px solid #2e2e2e",
                  borderRadius: "50%", fontSize: "26px", cursor: "pointer",
                }}>
                  {a}
                </button>
              ))}
            </div>
            <div style={{ padding: "0 28px 24px", textAlign: "center" }}>
              <span style={{ fontSize: "12px", color: "#555" }}>Photo upload — coming soon</span>
            </div>
          </div>
        </div>
      )}

      {/* ════ NEW / EDIT PROJECT MODAL ════════════════════════ */}
      {showNewProject && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <div style={S.modalTitle}>
                {editingProject ? `Edit Project #${editingProject.project_number} — ${editingProject.project_name}` : "New Project"}
              </div>
              <button style={S.closeBtn} onClick={() => { setShowNewProject(false); setEditingProject(null); }}>✕</button>
            </div>

            {/* Section tabs */}
            <div style={S.sectionTabBar}>
              {SECTIONS.map((sec, i) => (
                <button
                  key={i}
                  style={{ ...S.sectionTab, ...(pSection === i ? S.sectionTabActive : {}) }}
                  onClick={() => setPSection(i)}
                  type="button"
                >
                  {sec}
                </button>
              ))}
            </div>

            {pError && <div style={S.formError}>{pError}</div>}

            <form onSubmit={createProject}>
              <div style={S.modalBody}>

                {pSection === 0 && (
                  <div style={S.formGrid}>
                    <F label="PROJECT NAME *"  name="project_name"   val={pForm.project_name}   set={setPForm} pForm={pForm} full placeholder="e.g. Thunder Bay Correctional Complex" />
                    <F label="JOB NUMBER"      name="job_number"     val={pForm.job_number}     set={setPForm} pForm={pForm} placeholder="e.g. 1930 (your workplace number)" />
                    <Sel label="PROJECT GRADE" name="project_grade"  val={pForm.project_grade}  set={setPForm} pForm={pForm} opts={GRADES} />
                    <Sel label="STANDARD"      name="standard"       val={pForm.standard}       set={setPForm} pForm={pForm} opts={STANDARDS} />
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={S.formLabel}>DESCRIPTION</label>
                      <textarea name="description" value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })} style={S.formTextarea} rows={3} placeholder="Brief description of this project..." />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={S.formLabel}>COMPLIANCE</label>
                      <div style={{ display: "flex", gap: "24px", marginTop: "6px" }}>
                        {[["compliance_leed","LEED"],["compliance_fsc","FSC"],["compliance_fr","FR"]].map(([key,label]) => (
                          <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={pForm[key]}
                              onChange={e => setPForm({ ...pForm, [key]: e.target.checked })}
                              style={{ width: "16px", height: "16px", accentColor: "#4f8ef7", cursor: "pointer" }}
                            />
                            <span style={{ fontSize: "14px", color: "#ffffff", fontFamily: "'IBM Plex Sans', monospace", letterSpacing: "1px" }}>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {pSection === 1 && (
                  <div style={S.formGrid}>
                    <F label="DRAWN BY"        name="drawn_by"        val={pForm.drawn_by}        set={setPForm} pForm={pForm} placeholder="Initials e.g. RPB" />
                    <F label="CHECKED BY"      name="checked_by"      val={pForm.checked_by}      set={setPForm} pForm={pForm} placeholder="Initials e.g. AF" />
                    <F label="PROJECT MANAGER" name="project_manager" val={pForm.project_manager} set={setPForm} pForm={pForm} />
                    <F label="DRAFTSMAN"       name="draftsman"       val={pForm.draftsman}       set={setPForm} pForm={pForm} />
                    <F label="ARCHITECT"       name="architect_name"  val={pForm.architect_name}  set={setPForm} pForm={pForm} />
                    <F label="ESTIMATOR"       name="estimator_name"  val={pForm.estimator_name}  set={setPForm} pForm={pForm} />
                    <F label="CONTRACTOR"      name="contractor_name" val={pForm.contractor_name} set={setPForm} pForm={pForm} />
                  </div>
                )}

                {pSection === 2 && (
                  <div style={S.formGrid}>
                    <F label="CLIENT NAME"    name="client_name"    val={pForm.client_name}    set={setPForm} pForm={pForm} full />
                    <F label="CLIENT ADDRESS" name="client_address" val={pForm.client_address} set={setPForm} pForm={pForm} full />
                    <F label="CLIENT PHONE"   name="client_phone"   val={pForm.client_phone}   set={setPForm} pForm={pForm} />
                    <F label="CLIENT FAX"     name="client_fax"     val={pForm.client_fax}     set={setPForm} pForm={pForm} />
                    <F label="CLIENT EMAIL"   name="client_email"   val={pForm.client_email}   set={setPForm} pForm={pForm} full type="email" />
                  </div>
                )}

                {pSection === 3 && (
                  <div style={S.formGrid}>
                    <F label="JOB SITE NAME"    name="jobsite_name"    val={pForm.jobsite_name}    set={setPForm} pForm={pForm} full />
                    <F label="JOB SITE ADDRESS" name="jobsite_address" val={pForm.jobsite_address} set={setPForm} pForm={pForm} full />
                    <F label="JOB SITE PHONE"   name="jobsite_phone"   val={pForm.jobsite_phone}   set={setPForm} pForm={pForm} />
                    <F label="JOB SITE FAX"     name="jobsite_fax"     val={pForm.jobsite_fax}     set={setPForm} pForm={pForm} />
                    <F label="JOB SITE EMAIL"   name="jobsite_email"   val={pForm.jobsite_email}   set={setPForm} pForm={pForm} full type="email" />
                  </div>
                )}

                {pSection === 4 && (
                  <div style={S.formGrid}>
                    <F label="START DATE"      name="scheduled_start_date"      val={pForm.scheduled_start_date}      set={setPForm} pForm={pForm} type="date" />
                    <F label="COMPLETION DATE" name="scheduled_completion_date" val={pForm.scheduled_completion_date} set={setPForm} pForm={pForm} type="date" />
                    <F label="PROJECT BUDGET ($)" name="project_budget"         val={pForm.project_budget}            set={setPForm} pForm={pForm} type="number" placeholder="0.00" />
                  </div>
                )}

              </div>

              <div style={S.modalFooter}>
                <div style={{ display: "flex", gap: "8px" }}>
                  {pSection > 0 && <button type="button" style={S.prevBtn} onClick={() => setPSection(pSection - 1)}>← Prev</button>}
                  {pSection < SECTIONS.length - 1 && <button type="button" style={S.nextBtn} onClick={() => setPSection(pSection + 1)}>Next →</button>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" style={S.discardBtn} onClick={() => { setShowNewProject(false); setEditingProject(null); }}>Discard</button>
                  <button type="submit" style={{ ...S.addBtn, opacity: pLoading ? 0.7 : 1 }} disabled={pLoading}>
                    {pLoading ? "Saving..." : editingProject ? "Save Changes" : "Add Project"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ NEW DRAWING MODAL ═══════════════════════════════ */}
      {showNewDrawing && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: "560px" }}>
            <div style={S.modalHeader}>
              <div style={S.modalTitle}>New Drawing</div>
              <button style={S.closeBtn} onClick={() => setShowNewDrawing(false)}>✕</button>
            </div>
            {dError && <div style={S.formError}>{dError}</div>}
            <form onSubmit={createDrawing}>
              <div style={S.modalBody}>
                <div style={S.formGrid}>

                  {/* Drawing number with special validation */}
                  <div style={S.formField}>
                    <label style={S.formLabel}>DRAWING NUMBER *</label>
                    <input
                      type="text"
                      value={dForm.drawing_number}
                      onChange={handleDrawingNumberInput}
                      placeholder="e.g. D9501"
                      maxLength={5}
                      style={{
                        ...S.formInput,
                        borderColor: dForm.drawing_number && !validateDrawingNumber(dForm.drawing_number) ? "#f47070" : "#1e1e1e",
                        fontFamily: "'IBM Plex Sans', monospace",
                        letterSpacing: "2px",
                        fontSize: "15px",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "#555", fontFamily: "'IBM Plex Sans', monospace" }}>
                      Format: D + 4 digits. Pages: D9501.01, D9501.02
                    </span>
                  </div>

                  <F label="MW# (MILLWORK SCOPE)"   name="mw_number"        val={dForm.mw_number}        set={setDForm} pForm={dForm} placeholder="e.g. MW-01" />
                  <F label="TITLE *"                name="title"            val={dForm.title}            set={setDForm} pForm={dForm} placeholder="e.g. Staff Lunch Counter" full />
                  <Sel label="SCALE"                name="scale"            val={dForm.scale}            set={setDForm} pForm={dForm} opts={SCALES} />
                  <Sel label="PAPER SIZE"           name="paper_size"       val={dForm.paper_size}       set={setDForm} pForm={dForm} opts={PAPER_SIZES} display={p => p.replace("_", " ")} />
                  <F label="LEVEL"                  name="level"            val={dForm.level}            set={setDForm} pForm={dForm} placeholder="e.g. 1G" />
                  <F label="LOCATION"               name="location"         val={dForm.location}         set={setDForm} pForm={dForm} placeholder="e.g. 4.4.01" />
                  <F label="ARCH REFERENCE"         name="arch_ref"         val={dForm.arch_ref}         set={setDForm} pForm={dForm} placeholder="e.g. 7 A2.46B / REV#11" full />
                  <F label="ITEM DESCRIPTION"       name="item_description" val={dForm.item_description} set={setDForm} pForm={dForm} placeholder="e.g. Staff Lunch Counter" full />
                </div>
              </div>
              <div style={S.modalFooter}>
                <div />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" style={S.discardBtn} onClick={() => setShowNewDrawing(false)}>Discard</button>
                  <button type="submit" style={{ ...S.addBtn, opacity: dLoading ? 0.7 : 1 }} disabled={dLoading}>
                    {dLoading ? "Creating..." : "Create Drawing"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── MINI COMPONENTS ─────────────────────────────────────────
function F({ label, name, val, set, pForm, type = "text", placeholder = "", full = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...(full ? { gridColumn: "1 / -1" } : {}) }}>
      <label style={S.formLabel}>{label}</label>
      <input type={type} name={name} value={val} placeholder={placeholder}
        onChange={e => set({ ...pForm, [name]: e.target.value })}
        style={S.formInput} />
    </div>
  );
}

function Sel({ label, name, val, set, pForm, opts, display }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={S.formLabel}>{label}</label>
      <select name={name} value={val} onChange={e => set({ ...pForm, [name]: e.target.value })} style={S.formSelect}>
        <option value="">— Select —</option>
        {opts.map(o => <option key={o} value={o}>{display ? display(o) : o}</option>)}
      </select>
    </div>
  );
}


// ─── STYLES ──────────────────────────────────────────────────
const S = {
  page: {
    width: "100vw", height: "100vh",
    background: "#0d0d0d",
    display: "flex", flexDirection: "column",
    fontFamily: "'DM Sans', sans-serif",
    overflow: "hidden", color: "#e0e0e0",
  },

  // Top bar
  topBar: {
    height: "60px", flexShrink: 0,
    background: "#111111",
    borderBottom: "1px solid #1e1e1e",
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px", gap: "16px",
  },
  logo:         { display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 },
  logoMark: {
    width: "40px", height: "40px",
    background: "linear-gradient(135deg, #4f8ef7 0%, #2563d4 100%)",
    borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 18px rgba(79,142,247,0.4)",
  },
  logoMarkText: { fontSize: "14px", fontWeight: "800", color: "#fff", fontFamily: "'IBM Plex Sans', monospace", letterSpacing: "0.5px" },
  logoWords:    { display: "flex", flexDirection: "column", gap: "1px" },
  logoMain:     { fontSize: "17px", fontWeight: "700", color: "#ffffff", letterSpacing: "0.2px", lineHeight: "1" },
  logoSub:      { fontSize: "9px", color: "#4f8ef7", letterSpacing: "2.5px", fontFamily: "'IBM Plex Sans', monospace", lineHeight: "1" },

  topCenter: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" },
  breadcrumb: { display: "flex", alignItems: "center", gap: "8px" },
  breadcrumbRoot:    { fontSize: "14px", color: "#cccccc" },
  breadcrumbSep:     { fontSize: "14px", color: "#333" },
  breadcrumbCurrent: { fontSize: "14px", color: "#e0e0e0", fontWeight: "600" },
  breadcrumbMeta:    { fontSize: "13px", color: "#aaaaaa", fontFamily: "'IBM Plex Sans', monospace" },

  topRight:   { display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 },
  autosave:   { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#aaaaaa", fontFamily: "'IBM Plex Sans', monospace" },
  autosaveDot:{ width: "6px", height: "6px", borderRadius: "50%" },
  iconBtn: {
    width: "36px", height: "36px",
    background: "transparent", border: "1px solid #1e1e1e",
    borderRadius: "8px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "16px",
  },
  avatarBtn: {
    width: "38px", height: "38px",
    background: "#1a1a1a", border: "1px solid #2e2e2e",
    borderRadius: "50%", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  userMenu: {
    position: "absolute", top: "46px", right: 0,
    width: "230px", background: "#161616",
    border: "1px solid #2a2a2a", borderRadius: "8px",
    boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
    zIndex: 999, overflow: "hidden",
  },
  userMenuHeader: { display: "flex", alignItems: "center", gap: "12px", padding: "16px" },
  userMenuName: { fontSize: "14px", color: "#ffffff", fontWeight: "600" },
  userMenuRole: { fontSize: "11px", color: "#555", textTransform: "capitalize", fontFamily: "'IBM Plex Sans', monospace" },

  menuDivider:  { height: "1px", background: "#1e1e1e", margin: "4px 0" },
  menuItem: {
    width: "100%", padding: "11px 16px",
    background: "transparent", border: "none",
    color: "#cccccc", fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", textAlign: "left", display: "block",
  },

  // Body
  body: { flex: 1, display: "flex", overflow: "hidden" },

  // Left panel
  leftPanel: {
    height: "100%", flexShrink: 0,
    background: "#111111",
    borderRight: "1px solid #1e1e1e",
    display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
  explorerHeader: {
    height: "48px", flexShrink: 0,
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "0 14px",
    borderBottom: "1px solid #1e1e1e",
    background: "#161616",
  },
  explorerTitle: {
    fontSize: "11px", fontWeight: "700",
    color: "#ffffff", letterSpacing: "2px",
    fontFamily: "'IBM Plex Sans', monospace",
    fontSize: "12px",
  },
  explorerAddBtn: {
    height: "28px", padding: "0 12px",
    background: "#1a3a6a", color: "#4f8ef7",
    border: "1px solid #2a4a8a", borderRadius: "4px",
    fontSize: "12px", fontWeight: "600",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
  },

  // Project tabs — same style as workspace left panel
  projectTabBar: {
    display: "flex", flexShrink: 0,
    background: "#0d0d0d",
    borderBottom: "1px solid #1e1e1e",
    height: "36px",
  },
  projectTab: {
    flex: 1, height: "100%",
    background: "transparent", color: "#aaaaaa",
    border: "none", borderBottom: "2px solid transparent",
    borderRight: "1px solid #222222",
    cursor: "pointer", fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "6px", transition: "all 0.15s",
  },
  projectTabActive: {
    color: "#ffffff",
    borderBottom: "2px solid #4f8ef7",
    background: "#111111",
  },
  tabCount: {
    fontSize: "10px", background: "#1a3a6a",
    color: "#ffffff", padding: "1px 5px",
    borderRadius: "10px", fontFamily: "'IBM Plex Sans', monospace",
  },

  explorerList: { flex: 1, overflowY: "auto", padding: "6px" },
  placeholder: {
    padding: "20px 12px", fontSize: "13px",
    color: "#aaaaaa", textAlign: "center", lineHeight: "2",
  },
  inlineBtn: {
    background: "none", border: "none",
    color: "#4f8ef7", fontSize: "13px",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "4px 0",
  },

  projectRow: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "9px 8px 9px 10px",
    marginBottom: "2px", borderRadius: "4px",
    cursor: "pointer", position: "relative",
    border: "1px solid transparent",
    borderLeft: "3px solid transparent",
    transition: "all 0.12s",
  },
  projectRowActive: {
    background: "#0f1e35",
    border: "1px solid #1a3a6a",
    borderLeft: "3px solid #4f8ef7",
  },
  healthDot:      { width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0 },
  projectRowBody: { flex: 1, minWidth: 0 },
  projectRowName: {
    fontSize: "14px", fontWeight: "500",
    lineHeight: "1.3", whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis",
  },
  projectRowMeta: {
    fontSize: "12px", color: "#aaaaaa",
    marginTop: "3px", fontFamily: "'IBM Plex Sans', monospace",
  },
  projectMenuBtn: {
    width: "24px", height: "24px",
    background: "transparent", border: "none",
    color: "#555", fontSize: "16px",
    cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    borderRadius: "3px", flexShrink: 0,
  },
  projectPopover: {
    position: "absolute", right: 0, top: "28px",
    width: "190px", background: "#161616",
    border: "1px solid #2a2a2a", borderRadius: "6px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
    zIndex: 100, overflow: "hidden",
  },
  popoverItem: {
    width: "100%", padding: "11px 14px",
    background: "transparent", border: "none",
    color: "#cccccc", fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", textAlign: "left", display: "block",
  },

  // Divider
  divider: {
    width: "5px", height: "100%", flexShrink: 0,
    cursor: "col-resize", background: "#1a1a1a",
    position: "relative", zIndex: 10,
  },

  // Main area
  mainArea: {
    flex: 1, height: "100%",
    background: "#0d0d0d",
    display: "flex", flexDirection: "column",
    overflow: "hidden",
  },

  emptyState: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: "14px",
  },
  emptyGlyph: { fontSize: "52px", opacity: 0.06, lineHeight: "1" },
  emptyTitle: { fontSize: "18px", color: "#cccccc", fontWeight: "600" },
  emptyText:  { fontSize: "14px", color: "#888", textAlign: "center", maxWidth: "300px" },

  primaryBtn: {
    height: "38px", padding: "0 22px",
    background: "#4f8ef7", color: "#ffffff",
    border: "none", borderRadius: "4px",
    fontSize: "14px", fontWeight: "600",
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
  outlineBtn: {
    height: "32px", padding: "0 14px",
    background: "transparent", color: "#4f8ef7",
    border: "1px solid #4f8ef7", borderRadius: "4px",
    fontSize: "13px", fontWeight: "500",
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },

  // Project header
  projectHeader: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #1a1a1a",
    flexShrink: 0, background: "#111111",
  },
  projectHeaderLeft:  { display: "flex", flexDirection: "column", gap: "8px" },
  projectHeaderRight: { display: "flex", alignItems: "center", gap: "10px" },
  projectName: { fontSize: "22px", fontWeight: "700", color: "#ffffff", letterSpacing: "-0.3px" },
  projectTags: { display: "flex", gap: "6px", flexWrap: "wrap" },
  tag: {
    fontSize: "11px", padding: "3px 9px",
    background: "#1a1a1a", color: "#cccccc",
    border: "1px solid #222", borderRadius: "3px",
    fontFamily: "'IBM Plex Sans', monospace",
  },
  searchWrap:  { position: "relative", display: "flex", alignItems: "center" },
  searchIcon:  { position: "absolute", left: "10px", fontSize: "16px", color: "#444", pointerEvents: "none" },
  searchInput: {
    height: "32px", paddingLeft: "32px", paddingRight: "12px",
    background: "#1a1a1a", color: "#e0e0e0",
    border: "1px solid #222", borderRadius: "4px",
    outline: "none", fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif", width: "200px",
  },
  viewToggle:    { display: "flex", border: "1px solid #222", borderRadius: "4px", overflow: "hidden" },
  viewBtn:       { width: "32px", height: "32px", background: "transparent", border: "none", color: "#555", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  viewBtnActive: { background: "#1a1a1a", color: "#4f8ef7" },

  // Drawings explorer bar
  drawingsExplorerBar: {
    display: "flex", alignItems: "center",
    padding: "8px 24px",
    borderBottom: "1px solid #1a1a1a",
    background: "#0f0f0f",
    flexShrink: 0,
  },
  drawingsExplorerTitle: {
    fontSize: "11px", fontWeight: "700",
    color: "#ffffff", letterSpacing: "2px",
    fontFamily: "'IBM Plex Sans', monospace",
    fontSize: "12px",
  },

  // Cards
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px", padding: "20px 24px",
    overflowY: "auto", flex: 1, alignContent: "start",
  },
  card: {
    background: "#111111",
    border: "1px solid #1e1e1e",
    borderRadius: "8px",
    display: "flex", flexDirection: "column",
    overflow: "hidden",
    transition: "border-color 0.15s",
  },

  // Thumbnail
  thumbnail: {
    height: "140px", background: "#0a0f1a",
    position: "relative", overflow: "hidden",
    borderBottom: "1px solid #1e1e1e",
  },
  thumbnailGrid: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(rgba(79,142,247,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(79,142,247,0.06) 1px, transparent 1px)",
    backgroundSize: "20px 20px",
  },
  thumbnailContent: {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: "4px", padding: "12px",
  },
  thumbnailNumber: {
    fontSize: "22px", fontWeight: "800", color: "rgba(79,142,247,0.9)",
    fontFamily: "'IBM Plex Sans', monospace", letterSpacing: "2px",
  },
  thumbnailMW: {
    fontSize: "11px", color: "rgba(79,142,247,0.5)",
    fontFamily: "'IBM Plex Sans', monospace",
  },
  thumbnailTitle: {
    fontSize: "12px", color: "rgba(224,224,224,0.6)",
    textAlign: "center", maxWidth: "200px",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  thumbnailStatus: {
    position: "absolute", top: "10px", right: "10px",
    display: "flex", alignItems: "center", gap: "5px",
    fontSize: "10px", fontWeight: "500",
    padding: "3px 8px", borderRadius: "3px",
    border: "1px solid",
    fontFamily: "'IBM Plex Sans', monospace",
    textTransform: "uppercase", letterSpacing: "0.5px",
  },

  cardBody: { padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: "4px" },
  cardNumber: { fontSize: "15px", fontWeight: "700", color: "#4f8ef7", fontFamily: "'IBM Plex Sans', monospace" },
  cardTitle:  { fontSize: "14px", color: "#e0e0e0", fontWeight: "500", lineHeight: "1.4" },
  cardMeta:   { fontSize: "13px", color: "#aaaaaa", fontFamily: "'IBM Plex Sans', monospace" },

  cardActions: {
    display: "flex", gap: "4px",
    padding: "10px 14px",
    borderTop: "1px solid #1a1a1a",
    background: "#0d0d0d",
  },
  actOpen: {
    height: "28px", padding: "0 12px",
    background: "#4f8ef7", color: "#ffffff",
    border: "none", borderRadius: "3px",
    fontSize: "12px", fontWeight: "600",
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
  actBtn: {
    height: "28px", padding: "0 9px",
    background: "transparent", color: "#888",
    border: "1px solid #1e1e1e", borderRadius: "3px",
    fontSize: "12px", fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", whiteSpace: "nowrap",
  },

  // Status
  statusBadge: {
    display: "flex", alignItems: "center", gap: "5px",
    fontSize: "11px", fontWeight: "500",
    padding: "3px 8px", borderRadius: "3px",
    border: "1px solid",
    fontFamily: "'IBM Plex Sans', monospace",
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  statusDot: { width: "5px", height: "5px", borderRadius: "50%" },

  // List
  listWrap:   { flex: 1, overflowY: "auto", padding: "0 24px 20px" },
  listHeader: {
    display: "flex", alignItems: "center",
    padding: "10px 12px",
    borderBottom: "1px solid #1a1a1a",
    position: "sticky", top: 0,
    background: "#0d0d0d", zIndex: 1,
  },
  listCol:  { flex: 1, fontSize: "12px", color: "#aaaaaa", letterSpacing: "1px", fontFamily: "'IBM Plex Sans', monospace", textTransform: "uppercase" },
  listRow:  { display: "flex", alignItems: "center", padding: "11px 12px", borderBottom: "1px solid #141414" },
  listCell: { flex: 1, fontSize: "14px", color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px" },

  // Modal
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    width: "700px", maxHeight: "88vh",
    background: "#111111",
    border: "1px solid #1e1e1e",
    borderRadius: "10px",
    boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
    display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px",
    borderBottom: "1px solid #1a1a1a", flexShrink: 0,
  },
  modalTitle: { fontSize: "16px", fontWeight: "700", color: "#ffffff" },
  closeBtn: { background: "transparent", border: "none", color: "#555", fontSize: "18px", cursor: "pointer", lineHeight: "1", padding: "0" },

  sectionTabBar: {
    display: "flex", borderBottom: "1px solid #1a1a1a",
    background: "#0d0d0d", flexShrink: 0,
    overflowX: "auto", padding: "0 16px",
  },
  sectionTab: {
    height: "38px", padding: "0 16px",
    background: "transparent", color: "#666",
    border: "none", borderBottom: "2px solid transparent",
    cursor: "pointer", fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap", transition: "all 0.15s",
  },
  sectionTabActive: { color: "#ffffff", borderBottom: "2px solid #4f8ef7" },

  formError: {
    margin: "10px 24px 0",
    padding: "10px 14px",
    background: "#1a0a0a", border: "1px solid #3a1515",
    borderRadius: "4px", fontSize: "13px", color: "#f47070",
  },
  modalBody:   { flex: 1, overflowY: "auto", padding: "20px 24px" },
  modalFooter: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 24px",
    borderTop: "1px solid #1a1a1a", flexShrink: 0,
  },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  formField:{ display: "flex", flexDirection: "column", gap: "6px" },
  formLabel: {
    fontSize: "12px", fontWeight: "600", color: "#aaaaaa",
    letterSpacing: "1px", fontFamily: "'IBM Plex Sans', monospace",
  },
  formInput: {
    height: "38px", padding: "0 11px",
    background: "#0d0d0d", color: "#e0e0e0",
    border: "1px solid #1e1e1e", borderRadius: "4px",
    outline: "none", fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    width: "100%", boxSizing: "border-box",
  },
  formSelect: {
    height: "38px", padding: "0 11px",
    background: "#0d0d0d", color: "#e0e0e0",
    border: "1px solid #1e1e1e", borderRadius: "4px",
    outline: "none", fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    width: "100%", boxSizing: "border-box",
  },
  formTextarea: {
    padding: "9px 11px",
    background: "#0d0d0d", color: "#e0e0e0",
    border: "1px solid #1e1e1e", borderRadius: "4px",
    outline: "none", fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    width: "100%", boxSizing: "border-box", resize: "vertical",
  },

  discardBtn: {
    height: "38px", padding: "0 16px",
    background: "transparent", color: "#777",
    border: "1px solid #222", borderRadius: "4px",
    fontSize: "14px", fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
  addBtn: {
    height: "38px", padding: "0 22px",
    background: "#4f8ef7", color: "#ffffff",
    border: "none", borderRadius: "4px",
    fontSize: "14px", fontWeight: "600",
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
  prevBtn: {
    height: "38px", padding: "0 14px",
    background: "transparent", color: "#666",
    border: "1px solid #222", borderRadius: "4px",
    fontSize: "13px", fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
  nextBtn: {
    height: "38px", padding: "0 14px",
    background: "#1a1a1a", color: "#cccccc",
    border: "1px solid #2e2e2e", borderRadius: "4px",
    fontSize: "13px", fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
};

export default ProjectsPage;