import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ProjectsPage.css";
import ProjectsPageActionButtons from "../components/ProjectsPageActionButtons";
import ProjectSetup from "../components/ProjectSetup";
import { apiFetch, getUser, clearSession } from "../api.js";

const GRADES    = ["Custom", "Premium", "Standard", "Commercial", "Institutional"];
const STANDARDS = ["AWMAC", "AWI", "WI"];
const PAPER_SIZES = ["Arch_D", "Arch_C", "Arch_E", "ANSI_B", "ANSI_A", "A1", "A3"];
const PAPER_SIZE_LABELS = {
  "Arch_D": 'Arch D — 36" × 24"',
  "Arch_C": 'Arch C — 24" × 18"',
  "Arch_E": 'Arch E — 48" × 36"',
  "ANSI_B": 'ANSI B — 17" × 11"',
  "ANSI_A": 'ANSI A — 11" × 8.5"',
  "A1":     "A1 — 841 × 594 mm",
  "A3":     "A3 — 420 × 297 mm",
};
const AVATARS   = ["🏛", "📐", "📏", "🔩", "🪚", "⚙️", "🔧", "🏗", "✏️", "📋"];
const COMPLIANCE_OPTIONS = ["LEED", "FSC", "FR"];

// DB stores draft/review/approved/issued — UI shows human-readable labels
const STATUS_LABELS = {
  draft:             "In Drafting",
  review:            "In Review",
  approved:          "Reviewed as Noted",
  submittal_pending: "Submittal Pending",
  submitted:         "Submitted",
  issued:            "Final Release",
};

// Status → CSS class suffix. Colors defined in ProjectsPage.css (.pp-status--draft etc)
const STATUS_CLASS = {
  draft:             "draft",
  review:            "review",
  approved:          "approved",
  submittal_pending: "subpending",
  submitted:         "submitted",
  issued:            "issued",
};

const SORT_OPTIONS = [
  { value: "drawing_number", label: "Drawing #" },
  { value: "title",          label: "Drawing Name" },
  { value: "mw_number",      label: "MW#" },
  { value: "level",          label: "Level" },
  { value: "status",         label: "Status" },
];

const SECTIONS = ["Identity", "Team", "Client", "Job Site", "Schedule"];

function validateDrawingNumber(val) {
  return /^D[0-9]{4}$/.test(val.toUpperCase());
}

function ProjectsPage() {
  const navigate = useNavigate();
  const user     = getUser() || {};

  // ── Left panel resize ──────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(20);
  const LEFT_MIN = 15; const LEFT_MAX = 25;
  const isDragging   = useRef(false);
  const dragStartX   = useRef(0);
  const dragStartW   = useRef(0);
  const containerRef = useRef(null);
  const [dividerHover, setDividerHover] = useState(false);

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
  const [projectTab,       setProjectTab]       = useState("active");
  const [drawingSearch,    setDrawingSearch]    = useState("");

  const [sortField, setSortField] = useState("drawing_number");
  const [sortDir,   setSortDir]   = useState("asc");

  // ── UI state ──────────────────────────────────────────────
  const [showNewProject,   setShowNewProject]   = useState(false);
  const [showNewDrawing,   setShowNewDrawing]   = useState(false);
  const [showUserMenu,     setShowUserMenu]     = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [projectMenuId,    setProjectMenuId]    = useState(null);
  const [editingProject,   setEditingProject]   = useState(null);
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
  const emptyDrawing = { drawing_number:"", mw_number:"", title:"", paper_size:"Arch_D", level:"", location:"", arch_ref:"", item_description:"", page_count: 1 };
  const [dForm,    setDForm]    = useState(emptyDrawing);
  const [dError,   setDError]   = useState("");
  const [dLoading, setDLoading] = useState(false);

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

  useEffect(() => {
    if (!user.id) { navigate("/login"); return; }
    loadProjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      const res  = await apiFetch(`/projects`);
      const data = await res.json();
      const groups = data.groups || [];
      setActiveProjects(  groups.find(g => g.label === "Active")?.projects   || []);
      setArchivedProjects(groups.find(g => g.label === "Archived")?.projects || []);
    } catch (err) {
      console.error("loadProjects failed:", err);
      setActiveProjects([]); setArchivedProjects([]);
    }
    setLoadingProjects(false);
  }

  async function loadDrawings(pid) {
    setLoadingDrawings(true); setDrawings([]);
    try {
      const res  = await apiFetch(`/drawings/project/${pid}`);
      const data = await res.json();
      setDrawings(data.drawings || []);
    } catch (err) {
      console.error("loadDrawings failed:", err);
      setDrawings([]);
    }
    setLoadingDrawings(false);
  }

  function selectProject(p) {
    setSelectedProject(p);
    setDrawingSearch("");
    setProjectMenuId(null);
    loadDrawings(p.id);
  }

  function signOut() { clearSession(); navigate("/login"); }
  function pickAvatar(a) { setUserAvatar(a); localStorage.setItem("sl_avatar", a); setShowAvatarPicker(false); }

  // ── Create / Edit project ─────────────────────────────────
  async function createProject(e) {
    e.preventDefault();
    if (!pForm.project_name.trim()) { setPError("Project name is required."); return; }
    setPLoading(true); setPError("");
    try {
      const url    = editingProject ? `/projects/${editingProject.id}` : `/projects`;
      const method = editingProject ? "PUT" : "POST";
      const body   = {
        ...pForm,
        project_grade: pForm.project_grade || null,
        standard:      pForm.standard      || null,
        scheduled_start_date:      pForm.scheduled_start_date      || null,
        scheduled_completion_date: pForm.scheduled_completion_date || null,
        project_budget: pForm.project_budget ? parseFloat(pForm.project_budget) : null,
      };
      const res  = await apiFetch(url, { method, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setPError(data.detail || "Failed."); setPLoading(false); return; }
      setShowNewProject(false); setEditingProject(null);
      setPForm(emptyProject); setPSection(0); setPError("");
      await loadProjects();
      if (!editingProject) selectProject(data.project);
    } catch (err) {
      console.error("createProject failed:", err);
      setPError("Could not connect to server.");
    }
    setPLoading(false);
  }

  function openEditProject(p) {
    setEditingProject(p);
    setPForm({
      project_name: p.project_name || "", job_number: p.job_number || "",
      description: p.description || "", project_grade: p.project_grade || "",
      standard: p.standard || "", drawn_by: p.drawn_by || "",
      checked_by: p.checked_by || "", project_manager: p.project_manager || "",
      draftsman: p.draftsman || "", architect_name: p.architect_name || "",
      estimator_name: p.estimator_name || "", contractor_name: p.contractor_name || "",
      client_name: p.client_name || "", client_address: p.client_address || "",
      client_phone: p.client_phone || "", client_fax: p.client_fax || "",
      client_email: p.client_email || "", jobsite_name: p.jobsite_name || "",
      jobsite_address: p.jobsite_address || "", jobsite_phone: p.jobsite_phone || "",
      jobsite_fax: p.jobsite_fax || "", jobsite_email: p.jobsite_email || "",
      scheduled_start_date: p.scheduled_start_date || "",
      scheduled_completion_date: p.scheduled_completion_date || "",
      project_budget: p.project_budget ? String(p.project_budget) : "",
      compliance_leed: p.compliance_leed || false,
      compliance_fsc:  p.compliance_fsc  || false,
      compliance_fr:   p.compliance_fr   || false,
    });
    setPSection(0); setPError("");
    setShowNewProject(true); setProjectMenuId(null);
  }
  // ── Delete project async fnction  ────────────────────────────────────────
  async function deleteProject(id) {
    setProjectMenuId(null);
    try {
      const res = await apiFetch(`/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("deleteProject failed:", data.detail || res.status);
      }
      if (selectedProject?.id === id) setSelectedProject(null);
      await loadProjects();
    } catch (err) {
      console.error("deleteProject failed:", err);
    }
  }

  // ── Archive project async fnction  ────────────────────────────────────────
  async function archiveProject(id) {
  try {
    const res = await apiFetch(`/projects/${id}`, {
      method:  "PUT",
      body:    JSON.stringify({ status: "archived" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("archiveProject failed:", data.detail || res.status);
      return;
    }
    // If the archived project was the one open in the main area, clear it
    if (selectedProject?.id === id) setSelectedProject(null);
    setArchiveConfirm(null);   // close the modal
    await loadProjects();      // refresh — project now appears in Archived tab
  } catch (err) {
    console.error("archiveProject failed:", err);
  }
  }
  // ── Restore project async fnction  ────────────────────────────────────────

  async function restoreProject(id) {
  try {
    const res = await apiFetch(`/projects/${id}`, {
      method:  "PUT",
      body:    JSON.stringify({ status: "active" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("restoreProject failed:", data.detail || res.status);
      return;
    }
    setProjectMenuId(null);
    await loadProjects();   // project now returns to Active tab
  } catch (err) {
    console.error("restoreProject failed:", err);
  }
  }
  // ── Delete drawing / Archive project  ────────────────────────────────────────

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteError,   setDeleteError]   = useState("");
  const [archiveConfirm, setArchiveConfirm] = useState(null);
  const [archivedNotice, setArchivedNotice] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  async function confirmDeleteDrawing() {
    if (!deleteConfirm) return;
    setDeleteError("");
    try {
      const res = await apiFetch(`/drawings/${deleteConfirm.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.detail || `Server error ${res.status}`);
        return;
      }
      setDeleteConfirm(null);
      await loadDrawings(selectedProject.id);
      await loadProjects();
    } catch {
      setDeleteError("Could not connect to server.");
    }
  }

  // ── Drawing Viewer ────────────────────────────────────────
  const [viewerDrawing, setViewerDrawing] = useState(null);
  const [zoom,          setZoom]          = useState(100);
  const [currentPage,   setCurrentPage]   = useState(1);
  const ZOOM_MIN = 100; const ZOOM_MAX = 2400;
  const isPanning     = useRef(false);
  const panStart      = useRef({ x: 0, y: 0 });
  const panOffset     = useRef({ x: 0, y: 0 });
  const panLast       = useRef({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canvasRef     = useRef(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    function onWheel(e) {
      if (!e.ctrlKey) return;
      e.preventDefault(); e.stopPropagation();
      const delta = e.deltaY > 0 ? -15 : 15;
      setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)));
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [viewerDrawing]);

  async function openViewer(d) {
    setZoom(100); setCurrentPage(1);
    setPan({ x: 0, y: 0 }); panOffset.current = { x: 0, y: 0 };
    setViewerDrawing(d);
    try {
      const res  = await apiFetch(`/drawings/${d.id}`);
      const data = await res.json();
      if (res.ok && data.drawing) setViewerDrawing(data.drawing);
    } catch (err) {
      console.error("openViewer fetch failed:", err);
    }
  }
  function closeViewer() { setViewerDrawing(null); }

  function handleViewerMouseDown(e) {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current  = { x: e.clientX, y: e.clientY };
    panLast.current   = { ...panOffset.current };
  }
  function handleViewerMouseMove(e) {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    panOffset.current = { x: panLast.current.x + dx, y: panLast.current.y + dy };
    setPan({ ...panOffset.current });
  }
  function handleViewerMouseUp() { isPanning.current = false; }

  function zoomIn()    { setZoom(z => Math.min(ZOOM_MAX, z + 25)); }
  function zoomOut()   { setZoom(z => Math.max(ZOOM_MIN, z - 25)); }
  function zoomReset() { setZoom(100); setPan({ x: 0, y: 0 }); panOffset.current = { x: 0, y: 0 }; }

  const totalPages = viewerDrawing?.total_pages || 1;

  // ── Viewer sidebar resize (stable refs to avoid listener leaks) ──
  const SIDEBAR_MIN = 25; const SIDEBAR_MAX = 40;
  const [sidebarPct,      setSidebarPct]      = useState(28);
  const [sidebarDivHover, setSidebarDivHover] = useState(false);
  const isSidebarDrag  = useRef(false);
  const sidebarDragX   = useRef(0);
  const sidebarDragPct = useRef(28);
  const viewerRef      = useRef(null);

  const onSidebarMouseMove = useCallback((e) => {
    if (!isSidebarDrag.current || !viewerRef.current) return;
    const vw  = viewerRef.current.getBoundingClientRect().width;
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

  // ── Create drawing ────────────────────────────────────────
  async function createDrawing(e) {
    e.preventDefault();
    if (!selectedProject) { setDError("No project selected."); return; }
    if (!dForm.drawing_number.trim()) { setDError("Drawing number is required."); return; }
    if (!validateDrawingNumber(dForm.drawing_number)) {
      setDError("Drawing number must be D followed by exactly 4 digits (e.g. D9501). Pages: D9501.01"); return;
    }
    if (!dForm.title.trim()) { setDError("Title is required."); return; }
    setDLoading(true); setDError("");
    try {
      const res  = await apiFetch(`/drawings`, {
        method: "POST",
        body: JSON.stringify({
          project_id:  selectedProject.id,
          ...dForm,
          drawing_number: dForm.drawing_number.toUpperCase(),
          page_count: dForm.page_count || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setDError(data.detail || "Failed."); setDLoading(false); return; }
      setShowNewDrawing(false); setDForm(emptyDrawing); setDError("");
      await loadDrawings(selectedProject.id);
    } catch (err) {
      console.error("createDrawing failed:", err);
      setDError("Could not connect.");
    }
    setDLoading(false);
  }

  function openDrawing(d) {
    localStorage.setItem("sl_drawing", JSON.stringify(d));
    localStorage.setItem("sl_project", JSON.stringify(selectedProject));
    navigate("/workspace");
  }

  function handleDrawingNumberInput(e) {
    let val = e.target.value.toUpperCase().replace(/[^D0-9]/g, "");
    if (val.length > 0 && val[0] !== "D") val = "D" + val.replace(/D/g, "");
    if (val.length > 5) val = val.slice(0, 5);
    setDForm({ ...dForm, drawing_number: val }); setDError("");
  }

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  const filtered = drawings
    .filter(d =>
      d.drawing_number.toLowerCase().includes(drawingSearch.toLowerCase()) ||
      d.title.toLowerCase().includes(drawingSearch.toLowerCase())
    )
    .sort((a, b) => {
      const av = (a[sortField] || "").toString().toLowerCase();
      const bv = (b[sortField] || "").toString().toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 :  1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

  const displayedProjects = projectTab === "active" ? activeProjects : archivedProjects;
  const isArchived = selectedProject?.status === "archived";

  // Sort arrow for list column headers
  const sortArrow = (field) =>
    sortField === field ? <span className="pp-sort-arrow">{sortDir === "asc" ? " ↑" : " ↓"}</span> : null;

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="pp-page" ref={containerRef}>

      {/* ════ TOP BAR ════════════════════════════════════════ */}
      <div className="pp-topbar">
        <div className="pp-logo">
          <div className="pp-logo-mark"><span className="pp-logo-mark-text">SL</span></div>
          <div className="pp-logo-words">
            <span className="pp-logo-main">ScriptedLines</span>
            <span className="pp-logo-sub">MILLWORK STUDIO</span>
          </div>
        </div>

        <div className="pp-top-center">
          {selectedProject ? (
            <div className="pp-breadcrumb">
              <span className="pp-bc-root">Projects Space</span>
              <span className="pp-bc-sep">›</span>
              <span className="pp-bc-current">{selectedProject.project_name}</span>
              <span className="pp-bc-sep">·</span>
              <span className="pp-bc-meta">#{selectedProject.project_number}</span>
              {selectedProject.job_number && <>
                <span className="pp-bc-sep">·</span>
                <span className="pp-bc-meta">Job# {selectedProject.job_number}</span>
              </>}
            </div>
          ) : (
            <span className="pp-bc-root">Projects Space</span>
          )}
        </div>

        <div className="pp-top-right">
          <div className="pp-autosave">
            <div className="pp-autosave-dot pp-autosave-dot--on" />
            <span>Saved</span>
          </div>
          <button className="pp-icon-btn" title="Notifications">🔔</button>
          <div className="pp-rel" ref={userMenuRef}>
            <button className="pp-avatar-btn" onClick={() => { setShowUserMenu(!showUserMenu); setShowAvatarPicker(false); }}>
              <span className="pp-avatar-emoji">{userAvatar}</span>
            </button>
            {showUserMenu && (
              <div className="pp-user-menu">
                <div className="pp-user-menu-header">
                  <div className="pp-user-menu-avatar">{userAvatar}</div>
                  <div>
                    <div className="pp-user-menu-name">{user.first_name} {user.last_name}</div>
                    <div className="pp-user-menu-role">{user.role}</div>
                  </div>
                </div>
                <div className="pp-menu-divider" />
                <button className="pp-menu-item" onClick={() => { setShowAvatarPicker(true); setShowUserMenu(false); }}>🖼  Change Avatar</button>
                <button className="pp-menu-item">👤  Account Settings</button>
                <button className="pp-menu-item">⚙️  Company Settings</button>
                <button className="pp-menu-item">💳  Manage Subscription</button>
                <div className="pp-menu-divider" />
                <button className="pp-menu-item pp-menu-item--danger" onClick={signOut}>→  Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════ BODY ════════════════════════════════════════════ */}
      <div className="pp-body">

        {/* ── LEFT PANEL ─────────────────────────────────── */}
        <div className="pp-left-panel" style={{ width: `${leftWidth}%` }}>
          <div className="pp-explorer-header">
            <span className="pp-explorer-title">PROJECT EXPLORER</span>
            <button className="pp-explorer-add-btn"
              onClick={() => { setShowNewProject(true); setEditingProject(null); setPForm(emptyProject); setPSection(0); setPError(""); }}>
              + New
            </button>
          </div>

          <div className="pp-tab-bar">
            <button className={`pp-tab${projectTab === "active" ? " pp-tab--active" : ""}`} onClick={() => setProjectTab("active")}>
              Active
              {activeProjects.length > 0 && <span className="pp-tab-count">{activeProjects.length}</span>}
            </button>
            <button className={`pp-tab${projectTab === "archived" ? " pp-tab--active" : ""}`} onClick={() => setProjectTab("archived")}>
              Archived
              {archivedProjects.length > 0 && <span className="pp-tab-count">{archivedProjects.length}</span>}
            </button>
          </div>

          <div className="pp-explorer-list">
            {loadingProjects ? (
              <div className="pp-placeholder">Loading...</div>
            ) : displayedProjects.length === 0 ? (
              <div className="pp-placeholder">
                {projectTab === "active" ? "No active projects." : "No archived projects."}
                {projectTab === "active" && (
                  <button className="pp-inline-btn"
                    onClick={() => { setShowNewProject(true); setEditingProject(null); setPForm(emptyProject); setPSection(0); setPError(""); }}>
                    + Create first project
                  </button>
                )}
              </div>
            ) : (
              displayedProjects.map(p => {
                const isActive = selectedProject?.id === p.id;
                return (
                  <div key={p.id}
                    className={`pp-project-row${isActive ? " pp-project-row--active" : ""}`}
                    onClick={() => selectProject(p)}>
                    <div className={`pp-health-dot${p.drawing_count > 0 ? " pp-health-dot--on" : ""}`} />
                    <div className="pp-project-row-body">
                      <div className="pp-project-row-name">
                        {p.job_number && <>
                          <span className="pp-project-row-jobnum">{p.job_number}</span>
                          <span className="pp-project-row-sep"> — </span>
                        </>}
                        {p.project_name}
                      </div>
                      <div className="pp-project-row-meta">
                        {p.drawing_count > 0 ? `${p.drawing_count} dwg` : "No drawings"}
                      </div>
                    </div>
                    <div className="pp-rel" ref={projectMenuId === p.id ? projectMenuRef : null}>
                      <button className="pp-project-menu-btn"
                        onClick={(e) => { e.stopPropagation(); setProjectMenuId(projectMenuId === p.id ? null : p.id); }}>
                        ⋯
                      </button>
                      {projectMenuId === p.id && (
                        <div className="pp-project-popover" onClick={e => e.stopPropagation()}>
                          {projectTab === "active" ? (
                            <>
                              <button className="pp-popover-item" onClick={() => openEditProject(p)}>✏️  Edit Project</button>
                              <div className="pp-menu-divider" />
                              <button className="pp-popover-item" onClick={() => { setArchiveConfirm(p); setProjectMenuId(null); }}>📦  Archive Project</button>
                            </>
                          ) : (
                            <>
                              <button className="pp-popover-item" onClick={() => restoreProject(p.id)}>↩  Restore Project</button>
                              <div className="pp-menu-divider" />
                              <button className="pp-popover-item pp-popover-item--danger" disabled title="Permanent delete — coming soon">🗑  Delete Permanently</button>
                            </>
                          )}
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
        <div className={`pp-divider${dividerHover ? " pp-divider--active" : ""}`}
          onMouseDown={onDividerDown}
          onMouseEnter={() => setDividerHover(true)}
          onMouseLeave={() => setDividerHover(false)} />

        {/* ── MAIN AREA ───────────────────────────────────── */}
        <div className="pp-main">
          {!selectedProject ? (
            <div className="pp-empty">
              <div className="pp-empty-glyph">⬡</div>
              <div className="pp-empty-title">No Project Selected</div>
              <div className="pp-empty-text">Select a project from the explorer or create a new one.</div>
              <button className="pp-btn-primary"
                onClick={() => { setShowNewProject(true); setEditingProject(null); setPForm(emptyProject); setPSection(0); setPError(""); }}>
                + New Project
              </button>
            </div>
          ) : (
            <>
              {/* Single drawings explorer bar — identity left, controls right */}
              <div className="pp-explorer-bar">

                {/* Left: project identity */}
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

                {/* Right: controls */}
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
                  <button className="pp-sort-dir-btn"
                    onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}>
                    {sortDir === "asc" ? "↑" : "↓"}
                  </button>
                  <div className="pp-view-toggle">
                    <button className={`pp-view-btn${viewMode === "card" ? " pp-view-btn--active" : ""}`} onClick={() => setViewMode("card")} title="Card view">⊞</button>
                    <button className={`pp-view-btn${viewMode === "list" ? " pp-view-btn--active" : ""}`} onClick={() => setViewMode("list")} title="List view">≡</button>
                  </div>
                  <button className="pp-btn-setup"
                    onClick={() => setShowSetup(true)}
                    title="Project setup — materials, hardware, defaults">
                    ⚙ Project Setup
                  </button>
                  <button className="pp-btn-newdwg"
                    onClick={() => { if (isArchived) { setArchivedNotice(true); return; } setShowNewDrawing(true); setDForm(emptyDrawing); setDError(""); }}>
                    + New Drawing
                  </button>
                </div>

              </div>

              {loadingDrawings ? (
                <div className="pp-placeholder">Loading drawings...</div>
              ) : filtered.length === 0 ? (
                <div className="pp-empty">
                  <div className="pp-empty-glyph">⬡</div>
                  <div className="pp-empty-title">No Drawings Yet</div>
                  <div className="pp-empty-text">Create the first drawing for this project.</div>
                  <button className="pp-btn-primary"
                    onClick={() => { if (isArchived) { setArchivedNotice(true); return; } setShowNewDrawing(true); setDForm(emptyDrawing); setDError(""); }}>
                    + New Drawing
                  </button>
                </div>
              ) : viewMode === "card" ? (

                /* CARD VIEW */
                <div className="pp-cards-grid">
                  {filtered.map(d => (
                    <div key={d.id} className="pp-card">
                      <div className="pp-thumb">
                        <div className="pp-thumb-grid" />
                        <div className={`pp-thumb-status pp-status--${STATUS_CLASS[d.status] || "draft"}`}>
                          <div className="pp-status-dot" />
                          {STATUS_LABELS[d.status] || d.status}
                        </div>
                      </div>
                      <div className="pp-card-body">
                        <div className="pp-card-line1">
                          <span className="pp-card-number">{d.drawing_number}</span>
                          <span className="pp-card-sep">·</span>
                          <span className="pp-card-title">{d.title}</span>
                          <span className="pp-card-rev">Rev {d.revision || "00"}</span>
                        </div>
                        <div className="pp-card-line2">
                          {d.mw_number  && <span className="pp-card-meta-item">MW# {d.mw_number}</span>}
                          {d.level      && <><span className="pp-card-dot">·</span><span className="pp-card-meta-item">Lv {d.level}</span></>}
                          {d.location   && <><span className="pp-card-dot">·</span><span className="pp-card-meta-item">{d.location}</span></>}
                          {d.arch_ref   && <><span className="pp-card-dot">·</span><span className="pp-card-meta-item pp-card-arch">{d.arch_ref}</span></>}
                        </div>
                        <div className="pp-card-line3">
                          <span className="pp-card-meta-item">{PAPER_SIZE_LABELS[d.paper_size] || d.paper_size}</span>
                          <span className="pp-card-dot">·</span>
                          <span className="pp-card-meta-item">{d.page_count || 1} {(d.page_count || 1) === 1 ? "Page" : "Pages"}</span>
                        </div>
                      </div>
                      <div className="pp-card-actions">
                        <ProjectsPageActionButtons
                          d={d}
                          isArchived={isArchived}
                          onOpen={openDrawing}
                          onView={openViewer}
                          onDelete={setDeleteConfirm}
                          onBlocked={() => setArchivedNotice(true)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

              ) : (

                /* LIST VIEW */
                <div className="pp-list-wrap">
                  <div className="pp-list-header">
                    <span className="pp-list-col pp-list-col--sortable pp-col-num" onClick={() => toggleSort("drawing_number")}>
                      Drawing #{sortArrow("drawing_number")}
                    </span>
                    <span className="pp-list-col pp-list-col--sortable pp-col-name" onClick={() => toggleSort("title")}>
                      Drawing Name{sortArrow("title")}
                    </span>
                    <span className="pp-list-col">Rev #</span>
                    <span className="pp-list-col pp-list-col--sortable" onClick={() => toggleSort("mw_number")}>
                      MW#{sortArrow("mw_number")}
                    </span>
                    <span className="pp-list-col pp-list-col--sortable" onClick={() => toggleSort("level")}>
                      Level{sortArrow("level")}
                    </span>
                    <span className="pp-list-col pp-list-col--sortable pp-col-status" onClick={() => toggleSort("status")}>
                      Status{sortArrow("status")}
                    </span>
                    <span className="pp-list-col pp-col-actions">Actions</span>
                  </div>

                  {filtered.map(d => (
                    <div key={d.id} className="pp-list-row">
                      <span className="pp-list-cell pp-cell-num">{d.drawing_number}</span>
                      <span className="pp-list-cell pp-col-name">{d.title}</span>
                      <span className="pp-list-cell pp-cell-mono">{d.revision || "00"}</span>
                      <span className="pp-list-cell pp-cell-mono">{d.mw_number || "—"}</span>
                      <span className="pp-list-cell">{d.level || "—"}</span>
                      <span className="pp-list-cell pp-col-status">
                        <span className={`pp-status-badge pp-status--${STATUS_CLASS[d.status] || "draft"}`}>
                          <div className="pp-status-dot" />
                          {STATUS_LABELS[d.status] || d.status}
                        </span>
                      </span>
                      <span className="pp-list-cell pp-col-actions">
                        <div className="pp-list-actions">
                          <ProjectsPageActionButtons
                            d={d}
                            isArchived={isArchived}
                            onOpen={openDrawing}
                            onView={openViewer}
                            onDelete={setDeleteConfirm}
                            onBlocked={() => setArchivedNotice(true)}
                          />
                        </div>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════ AVATAR PICKER ══════════════════════════════════ */}
      {showAvatarPicker && (
        <div className="pp-overlay">
          <div className="pp-modal pp-modal--avatar">
            <div className="pp-modal-header">
              <div className="pp-modal-title">Choose Avatar</div>
              <button className="pp-modal-close" onClick={() => setShowAvatarPicker(false)}>✕</button>
            </div>
            <div className="pp-avatar-grid">
              {AVATARS.map(a => (
                <button key={a} className={`pp-avatar-option${userAvatar === a ? " pp-avatar-option--selected" : ""}`}
                  onClick={() => pickAvatar(a)}>{a}</button>
              ))}
            </div>
            <div className="pp-avatar-hint">Photo upload — coming soon</div>
          </div>
        </div>
      )}

      {/* ════ NEW / EDIT PROJECT MODAL ════════════════════════ */}
      {showNewProject && (
        <div className="pp-overlay">
          <div className="pp-modal">
            <div className="pp-modal-header">
              <div className="pp-modal-title">
                {editingProject ? `Edit Project #${editingProject.project_number} — ${editingProject.project_name}` : "New Project"}
              </div>
              <button className="pp-modal-close" onClick={() => { setShowNewProject(false); setEditingProject(null); }}>✕</button>
            </div>

            <div className="pp-section-tabs">
              {SECTIONS.map((sec, i) => (
                <button key={i} type="button"
                  className={`pp-section-tab${pSection === i ? " pp-section-tab--active" : ""}`}
                  onClick={() => setPSection(i)}>{sec}</button>
              ))}
            </div>

            {pError && <div className="pp-form-error">{pError}</div>}

            <form onSubmit={createProject}>
              <div className="pp-modal-body">
                {pSection === 0 && (
                  <div className="pp-form-grid">
                    <F label="PROJECT NAME *" name="project_name" val={pForm.project_name} set={setPForm} pForm={pForm} full placeholder="e.g. Thunder Bay Correctional Complex" />
                    <F label="JOB NUMBER"     name="job_number"   val={pForm.job_number}   set={setPForm} pForm={pForm} placeholder="e.g. 1930" />
                    <Sel label="PROJECT GRADE" name="project_grade" val={pForm.project_grade} set={setPForm} pForm={pForm} opts={GRADES} />
                    <Sel label="STANDARD"      name="standard"      val={pForm.standard}      set={setPForm} pForm={pForm} opts={STANDARDS} />
                    <div className="pp-form-field">
                      <label className="pp-form-label">COMPLIANCE</label>
                      <div className="pp-checkbox-group">
                        {[["compliance_leed","LEED"],["compliance_fsc","FSC"],["compliance_fr","FR"]].map(([key, lbl]) => (
                          <label key={key} className="pp-checkbox-label">
                            <input type="checkbox" checked={pForm[key]}
                              onChange={e => setPForm({ ...pForm, [key]: e.target.checked })} />
                            {lbl}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="pp-form-field pp-form-full">
                      <label className="pp-form-label">DESCRIPTION</label>
                      <textarea className="pp-form-textarea" rows={3} name="description"
                        value={pForm.description} placeholder="Brief description of this project..."
                        onChange={e => setPForm({ ...pForm, description: e.target.value })} />
                    </div>
                  </div>
                )}
                {pSection === 1 && (
                  <div className="pp-form-grid">
                    <F label="DRAWN BY"        name="drawn_by"        val={pForm.drawn_by}        set={setPForm} pForm={pForm} placeholder="e.g. RPB" />
                    <F label="CHECKED BY"      name="checked_by"      val={pForm.checked_by}      set={setPForm} pForm={pForm} placeholder="e.g. AF" />
                    <F label="PROJECT MANAGER" name="project_manager" val={pForm.project_manager} set={setPForm} pForm={pForm} />
                    <F label="DRAFTSMAN"       name="draftsman"       val={pForm.draftsman}       set={setPForm} pForm={pForm} />
                    <F label="ARCHITECT"       name="architect_name"  val={pForm.architect_name}  set={setPForm} pForm={pForm} />
                    <F label="ESTIMATOR"       name="estimator_name"  val={pForm.estimator_name}  set={setPForm} pForm={pForm} />
                    <F label="CONTRACTOR"      name="contractor_name" val={pForm.contractor_name} set={setPForm} pForm={pForm} />
                  </div>
                )}
                {pSection === 2 && (
                  <div className="pp-form-grid">
                    <F label="CLIENT NAME"    name="client_name"    val={pForm.client_name}    set={setPForm} pForm={pForm} full />
                    <F label="CLIENT ADDRESS" name="client_address" val={pForm.client_address} set={setPForm} pForm={pForm} full />
                    <F label="CLIENT PHONE"   name="client_phone"   val={pForm.client_phone}   set={setPForm} pForm={pForm} />
                    <F label="CLIENT FAX"     name="client_fax"     val={pForm.client_fax}     set={setPForm} pForm={pForm} />
                    <F label="CLIENT EMAIL"   name="client_email"   val={pForm.client_email}   set={setPForm} pForm={pForm} full type="email" />
                  </div>
                )}
                {pSection === 3 && (
                  <div className="pp-form-grid">
                    <F label="JOB SITE NAME"    name="jobsite_name"    val={pForm.jobsite_name}    set={setPForm} pForm={pForm} full />
                    <F label="JOB SITE ADDRESS" name="jobsite_address" val={pForm.jobsite_address} set={setPForm} pForm={pForm} full />
                    <F label="JOB SITE PHONE"   name="jobsite_phone"   val={pForm.jobsite_phone}   set={setPForm} pForm={pForm} />
                    <F label="JOB SITE FAX"     name="jobsite_fax"     val={pForm.jobsite_fax}     set={setPForm} pForm={pForm} />
                    <F label="JOB SITE EMAIL"   name="jobsite_email"   val={pForm.jobsite_email}   set={setPForm} pForm={pForm} full type="email" />
                  </div>
                )}
                {pSection === 4 && (
                  <div className="pp-form-grid">
                    <F label="START DATE"         name="scheduled_start_date"      val={pForm.scheduled_start_date}      set={setPForm} pForm={pForm} type="date" />
                    <F label="COMPLETION DATE"    name="scheduled_completion_date" val={pForm.scheduled_completion_date} set={setPForm} pForm={pForm} type="date" />
                    <F label="PROJECT BUDGET ($)" name="project_budget"            val={pForm.project_budget}            set={setPForm} pForm={pForm} type="number" placeholder="0.00" />
                  </div>
                )}
              </div>
              <div className="pp-modal-footer">
                <div className="pp-footer-group">
                  {pSection > 0 && <button type="button" className="pp-btn-prev" onClick={() => setPSection(pSection - 1)}>← Prev</button>}
                  {pSection < SECTIONS.length - 1 && <button type="button" className="pp-btn-next" onClick={() => setPSection(pSection + 1)}>Next →</button>}
                </div>
                <div className="pp-footer-group">
                  <button type="button" className="pp-btn-discard" onClick={() => { setShowNewProject(false); setEditingProject(null); }}>Discard</button>
                  <button type="submit" className="pp-btn-add" disabled={pLoading}>
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
        <div className="pp-overlay">
          <div className="pp-modal pp-modal--drawing">
            <div className="pp-modal-header">
              <div className="pp-modal-title">New Drawing</div>
              <button className="pp-modal-close" onClick={() => setShowNewDrawing(false)}>✕</button>
            </div>
            {dError && <div className="pp-form-error">{dError}</div>}
            <form onSubmit={createDrawing}>
              <div className="pp-modal-body">
                <div className="pp-form-grid">
                  <div className="pp-form-field">
                    <label className="pp-form-label">DRAWING NUMBER *</label>
                    <input type="text" value={dForm.drawing_number} onChange={handleDrawingNumberInput}
                      placeholder="e.g. D9501" maxLength={5}
                      className={`pp-form-input pp-input-dwgnum${dForm.drawing_number && !validateDrawingNumber(dForm.drawing_number) ? " pp-form-input--error" : ""}`} />
                    <span className="pp-form-hint">Format: D + 4 digits. Pages: D9501.01, D9501.02</span>
                  </div>
                  <F label="MW# (MILLWORK SCOPE)"  name="mw_number"        val={dForm.mw_number}        set={setDForm} pForm={dForm} placeholder="e.g. MW-01" />
                  <F label="TITLE *"               name="title"            val={dForm.title}            set={setDForm} pForm={dForm} placeholder="e.g. Staff Lunch Counter" full />
                  <Sel label="PAPER SIZE"          name="paper_size"       val={dForm.paper_size}       set={setDForm} pForm={dForm} opts={PAPER_SIZES} display={p => PAPER_SIZE_LABELS[p]} />
                  <div className="pp-form-field">
                    <label className="pp-form-label">NUMBER OF PAGES</label>
                    <input type="number" min="1" max="99" className="pp-form-input"
                      value={dForm.page_count}
                      onChange={e => setDForm({ ...dForm, page_count: Math.max(1, parseInt(e.target.value) || 1) })} />
                    <span className="pp-form-hint">How many canvas pages this drawing has (default 1)</span>
                  </div>
                  <F label="LEVEL"                 name="level"            val={dForm.level}            set={setDForm} pForm={dForm} placeholder="e.g. 1G" />
                  <F label="LOCATION"              name="location"         val={dForm.location}         set={setDForm} pForm={dForm} placeholder="e.g. 4.4.01" />
                  <F label="ARCH REFERENCE"        name="arch_ref"         val={dForm.arch_ref}         set={setDForm} pForm={dForm} placeholder="e.g. 7 A2.46B / REV#11" full />
                  <F label="ITEM DESCRIPTION"      name="item_description" val={dForm.item_description} set={setDForm} pForm={dForm} placeholder="e.g. Staff Lunch Counter" full />
                </div>
              </div>
              <div className="pp-modal-footer">
                <div />
                <div className="pp-footer-group">
                  <button type="button" className="pp-btn-discard" onClick={() => setShowNewDrawing(false)}>Discard</button>
                  <button type="submit" className="pp-btn-add" disabled={dLoading}>
                    {dLoading ? "Creating..." : "Create Drawing"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ DELETE CONFIRMATION ════════════════════════════ */}
      {deleteConfirm && (
        <div className="pp-overlay pp-overlay--top">
          <div className="pp-modal pp-modal--sm">
            <div className="pp-modal-header">
              <div className="pp-modal-title">Delete Drawing</div>
              <button className="pp-modal-close" onClick={() => { setDeleteConfirm(null); setDeleteError(""); }}>✕</button>
            </div>
            <div className="pp-delete-info">
              <div className="pp-delete-info-text">Are you sure you want to delete this drawing?</div>
              <div className="pp-delete-info-card">
                <div className="pp-delete-info-number">{deleteConfirm.drawing_number}</div>
                <div className="pp-delete-info-title">{deleteConfirm.title}</div>
              </div>
              <div className="pp-delete-warning">⚠ This action cannot be undone.</div>
              {deleteError && <div className="pp-delete-error">{deleteError}</div>}
            </div>
            <div className="pp-modal-footer">
              <div />
              <div className="pp-footer-group">
                <button className="pp-btn-discard" onClick={() => { setDeleteConfirm(null); setDeleteError(""); }}>Cancel</button>
                <button className="pp-btn-add pp-btn-add--danger" onClick={confirmDeleteDrawing}>Delete Drawing</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ════ ARCHIVE CONFIRMATION ═══════════════════════════════ */}
      {archiveConfirm && (
        <div className="pp-overlay pp-overlay--top">
          <div className="pp-modal pp-modal--sm">
            <div className="pp-modal-header">
              <div className="pp-modal-title">Archive Project</div>
              <button className="pp-modal-close" onClick={() => setArchiveConfirm(null)}>✕</button>
            </div>
            <div className="pp-delete-info">
              <div className="pp-delete-info-text">
                Archive this project?
              </div>
              <div className="pp-delete-info-card">
                <div className="pp-archive-line">
                  {archiveConfirm.job_number && <>
                    <span className="pp-archive-jobnum">{archiveConfirm.job_number}</span>
                    <span className="pp-archive-sep"> — </span>
                  </>}
                  <span className="pp-archive-pname">{archiveConfirm.project_name}</span>
                </div>
              </div>
              <div className="pp-delete-warning">
                ⚠ Archiving sets this project to read-only. You won't be able to add or edit drawings until you restore it from the Archive tab.
              </div>
            </div>
            <div className="pp-modal-footer">
              <div />
              <div className="pp-footer-group">
                <button className="pp-btn-discard" onClick={() => setArchiveConfirm(null)}>Discard</button>
                <button className="pp-btn-add" onClick={() => archiveProject(archiveConfirm.id)}>Archive Project</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ════ ARCHIVED — READ ONLY NOTICE ════════════════════════ */}
      {archivedNotice && (
        <div className="pp-overlay pp-overlay--top">
          <div className="pp-modal pp-modal--sm">
            <div className="pp-modal-header">
              <div className="pp-modal-title">Project Archived</div>
              <button className="pp-modal-close" onClick={() => setArchivedNotice(false)}>✕</button>
            </div>
            <div className="pp-delete-info">
              <div className="pp-delete-warning">
                ⚠ This is an archived project. You won't be able to create or edit drawings until you restore the project from the Archive tab.
              </div>
            </div>
            <div className="pp-modal-footer">
              <div />
              <div className="pp-footer-group">
                <button className="pp-btn-add" onClick={() => setArchivedNotice(false)}>Got it</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ════ DRAWING VIEWER ══════════════════════════════════ */}
      {viewerDrawing && (
        <div className="vw-overlay">
          <div className="vw-viewer" ref={viewerRef}>
            <div className="vw-header">
              <div className="vw-header-left">
                <span className="vw-header-number">{viewerDrawing.drawing_number}</span>
                <span className="vw-header-sep">·</span>
                <span className="vw-header-title">{viewerDrawing.title}</span>
                {selectedProject && <>
                  <span className="vw-header-sep">·</span>
                  <span className="vw-header-meta">#{selectedProject.project_number}</span>
                  <span className="vw-header-sep">·</span>
                  <span className="vw-header-meta">{selectedProject.project_name}</span>
                </>}
                {viewerDrawing.revision !== undefined && <>
                  <span className="vw-header-sep">·</span>
                  <span className="vw-header-rev">Rev {viewerDrawing.revision}</span>
                </>}
              </div>
              <div className="vw-header-right">
                <button className="vw-close-btn" onClick={closeViewer} title="Close viewer">✕</button>
              </div>
            </div>

            <div className="vw-body">
              <div className="vw-canvas-col">
                <div ref={canvasRef} className="vw-canvas"
                  onMouseDown={handleViewerMouseDown}
                  onMouseMove={handleViewerMouseMove}
                  onMouseUp={handleViewerMouseUp}
                  onMouseLeave={handleViewerMouseUp}>
                  {viewerDrawing.revisions && viewerDrawing.revisions.some(r => r.is_locked && r.pdf_path) ? (
                    <div className="vw-canvas-msg">
                      <div className="vw-canvas-msg-icon">📄</div>
                      <div className="vw-canvas-msg-title">PDF viewer — Phase 8</div>
                      <div className="vw-canvas-msg-sub">
                        {viewerDrawing.revisions.filter(r => r.is_locked).length} committed revision(s) available
                      </div>
                    </div>
                  ) : (
                    <div className="vw-canvas-empty">
                      <div className="vw-canvas-empty-glyph">⬡</div>
                      <div className="vw-canvas-empty-title">No revision has been committed for this drawing.</div>
                      <div className="vw-canvas-empty-text">
                        Open the drawing in the workspace, complete your work, then commit the revision to generate a PDF.
                      </div>
                    </div>
                  )}
                </div>

                <div className="vw-bottom-bar">
                  <div className="vw-bottom-inner">
                    <div className="vw-zoom-group">
                      <button className="vw-zoom-btn" onClick={zoomOut} disabled={zoom <= ZOOM_MIN}>−</button>
                      <span className="vw-zoom-display" onClick={zoomReset} title="Click to reset">{zoom}%</span>
                      <button className="vw-zoom-btn" onClick={zoomIn}  disabled={zoom >= ZOOM_MAX}>+</button>
                    </div>
                    <div className="vw-bottom-sep" />
                    <div className="vw-page-nav">
                      <button className="vw-page-btn" disabled={currentPage <= 1}
                        onClick={() => { setCurrentPage(p => p - 1); zoomReset(); }}>‹</button>
                      <div className="vw-page-display">
                        <span className="vw-page-label">Page</span>
                        <span className="vw-page-current">{currentPage}</span>
                        <span className="vw-page-label">of</span>
                        <span className="vw-page-total">{totalPages}</span>
                      </div>
                      <button className="vw-page-btn" disabled={currentPage >= totalPages}
                        onClick={() => { setCurrentPage(p => p + 1); zoomReset(); }}>›</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`vw-sidebar-divider${sidebarDivHover ? " vw-sidebar-divider--active" : ""}`}
                onMouseDown={onSidebarDividerDown}
                onMouseEnter={() => setSidebarDivHover(true)}
                onMouseLeave={() => setSidebarDivHover(false)} />

              <div className="vw-sidebar" style={{ width: `${sidebarPct}%` }}>
                <div className="vw-sidebar-label">PROPERTIES</div>
                <div className="vw-sidebar-empty">
                  <div className="vw-sidebar-empty-glyph">⬡</div>
                  <div className="vw-sidebar-coming">Coming soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ PROJECT SETUP ══════════════════════════════════════ */}
      {showSetup && selectedProject && (
        <ProjectSetup
          project={selectedProject}
          onClose={() => setShowSetup(false)}
        />
      )}

    </div>
  );
}

// ─── MINI COMPONENTS ─────────────────────────────────────────
function F({ label, name, val, set, pForm, type = "text", placeholder = "", full = false }) {
  return (
    <div className={`pp-form-field${full ? " pp-form-full" : ""}`}>
      <label className="pp-form-label">{label}</label>
      <input className="pp-form-input" type={type} name={name} value={val}
        placeholder={placeholder} onChange={e => set({ ...pForm, [name]: e.target.value })} />
    </div>
  );
}

function Sel({ label, name, val, set, pForm, opts, display }) {
  return (
    <div className="pp-form-field">
      <label className="pp-form-label">{label}</label>
      <select className="pp-form-select" name={name} value={val}
        onChange={e => set({ ...pForm, [name]: e.target.value })}>
        <option value="">— Select —</option>
        {opts.map(o => <option key={o} value={o}>{display ? display(o) : o}</option>)}
      </select>
    </div>
  );
}

export default ProjectsPage;