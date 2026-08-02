import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ProjectsPage.css";
import { getUser, clearSession } from "../../api/client.js";
import { useResizableSidebar } from "../../shared/useResizableSidebar.js";

import { useProjects }      from "./hooks/useProjects.js";
import { useDrawings }      from "./hooks/useDrawings.js";
import { useDrawingViewer } from "./hooks/useDrawingViewer.js";

import ProjectSidebar       from "./components/ProjectSidebar.jsx";
import DrawingExplorer      from "./components/DrawingExplorer.jsx";
import DrawingList          from "./components/DrawingList.jsx";
import DrawingViewerOverlay from "./components/DrawingViewerOverlay.jsx";
import UserMenu             from "./components/UserMenu.jsx";
import ProjectFormModal     from "./components/ProjectFormModal.jsx";
import DrawingFormModal     from "./components/DrawingFormModal.jsx";
import DeleteDrawingDialog  from "./components/DeleteDrawingDialog.jsx";
import ArchiveProjectDialog from "./components/ArchiveProjectDialog.jsx";
import ArchivedNoticeDialog from "./components/ArchivedNoticeDialog.jsx";
import ProjectSetup         from "../../components/ProjectSetup.jsx";

// ─────────────────────────────────────────────────────────────
// ProjectsPage.jsx
//
// Slim orchestrator: owns modal/dialog visibility and the three
// domain hooks (projects / drawings / viewer), plus the composed
// handlers below that touch more than one of them. No hook here
// reaches into another hook — see the comment on each composed
// handler for why the sequencing lives here instead.
//
// Everything else — list rendering, forms, the viewer canvas — is
// a child component in ./components/.
// ─────────────────────────────────────────────────────────────

function ProjectsPage() {
  const navigate = useNavigate();
  const user     = getUser() || {};

  const projects = useProjects();
  const drawings = useDrawings(projects.selectedProject?.id);
  const viewer   = useDrawingViewer();

  // ── Left panel resize (divider is a sibling of the panel, not a
  //    child, so it and the resize hook live here rather than in
  //    ProjectSidebar.jsx) ──────────────────────────────────────
  const containerRef = useRef(null);
  const leftPanel = useResizableSidebar({ containerRef, initial: 20, min: 15, max: 25, invert: false });
  const [dividerHover, setDividerHover] = useState(false);

  // ── Modal / dialog visibility — orchestration-level UI state ──
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showNewDrawing, setShowNewDrawing] = useState(false);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);  // drawing object
  const [deleteError,    setDeleteError]    = useState("");
  const [archiveConfirm, setArchiveConfirm] = useState(null);  // project object
  const [archivedNotice, setArchivedNotice] = useState(false);
  const [showSetup,      setShowSetup]      = useState(false);

  useEffect(() => {
    if (!user.id) navigate("/login");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function signOut() { clearSession(); navigate("/login"); }

  function openNewProjectModal()      { setEditingProject(null); setShowNewProject(true); }
  function openEditProjectModal(p)    { setEditingProject(p);    setShowNewProject(true); }
  function openNewDrawingModal() {
    if (isArchived) { setArchivedNotice(true); return; }
    setShowNewDrawing(true);
  }
  function openDrawing(d) { navigate(`/workspace/${d.id}`); }

  // ── Composed handlers ───────────────────────────────────────
  // Cross-hook cases identified during planning. No hook imports
  // or calls another hook — any action with side effects spanning
  // more than one domain is spelled out here instead of hidden
  // behind an optional callback param on a hook.

  async function handleCreateDrawing(payload) {
    const result = await drawings.create(payload);
    if (result.ok) await projects.refresh();   // keeps drawing_count badges in sync
    return result;
  }

  async function handleDeleteDrawing() {
    if (!deleteConfirm) return;
    setDeleteError("");
    const result = await drawings.remove(deleteConfirm.id);
    if (!result.ok) { setDeleteError(result.error); return; }
    setDeleteConfirm(null);
    await projects.refresh();                  // keeps drawing_count badges in sync
  }

  async function handleDeleteProject(id) {
    if (viewer.viewerDrawing?.project_id === id) viewer.close();
    if (projects.selectedProject?.id === id) { projects.clear(); drawings.clear(); }
    const result = await projects.remove(id);
    if (!result.ok) console.error("deleteProject failed:", result.error);
  }

  async function handleArchiveProject(id) {
    if (viewer.viewerDrawing?.project_id === id) viewer.close();
    if (projects.selectedProject?.id === id) { projects.clear(); drawings.clear(); }
    const result = await projects.archive(id);
    if (!result.ok) { console.error("archiveProject failed:", result.error); return; }
    setArchiveConfirm(null);
  }

  async function handleRestoreProject(id) {
    const result = await projects.restore(id);
    if (!result.ok) console.error("restoreProject failed:", result.error);
  }

  const isArchived = projects.selectedProject?.status === "archived";

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
          {projects.selectedProject ? (
            <div className="pp-breadcrumb">
              <span className="pp-bc-root">Projects Space</span>
              <span className="pp-bc-sep">›</span>
              <span className="pp-bc-current">{projects.selectedProject.project_name}</span>
              <span className="pp-bc-sep">·</span>
              <span className="pp-bc-meta">#{projects.selectedProject.project_number}</span>
              {projects.selectedProject.job_number && <>
                <span className="pp-bc-sep">·</span>
                <span className="pp-bc-meta">Job# {projects.selectedProject.job_number}</span>
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
          <UserMenu user={user} onSignOut={signOut} />
        </div>
      </div>

      {/* ════ BODY ════════════════════════════════════════════ */}
      <div className="pp-body">

        <ProjectSidebar
          widthPct={leftPanel.pct}
          activeProjects={projects.activeProjects}
          archivedProjects={projects.archivedProjects}
          filteredActiveProjects={projects.filteredActiveProjects}
          filteredArchivedProjects={projects.filteredArchivedProjects}
          projectSearch={projects.projectSearch}
          setProjectSearch={projects.setProjectSearch}
          loadingProjects={projects.loadingProjects}
          projectTab={projects.projectTab}
          setProjectTab={projects.setProjectTab}
          selectedProject={projects.selectedProject}
          onSelect={projects.select}
          onNewProject={openNewProjectModal}
          onEditProject={openEditProjectModal}
          onArchiveProject={p => setArchiveConfirm(p)}
          onRestoreProject={handleRestoreProject}
        />

        <div className={`pp-divider${(leftPanel.isDragging || dividerHover) ? " pp-divider--active" : ""}`}
          onMouseDown={leftPanel.onDividerDown}
          onMouseEnter={() => setDividerHover(true)}
          onMouseLeave={() => setDividerHover(false)} />

        <div className="pp-main">
          {!projects.selectedProject ? (
            <div className="pp-empty">
              <div className="pp-empty-glyph">⬡</div>
              <div className="pp-empty-title">No Project Selected</div>
              <div className="pp-empty-text">Select a project from the explorer or create a new one.</div>
              <button className="pp-btn-primary" onClick={openNewProjectModal}>+ New Project</button>
            </div>
          ) : (
            <>
              <DrawingExplorer
                selectedProject={projects.selectedProject}
                drawingSearch={drawings.drawingSearch}
                setDrawingSearch={drawings.setDrawingSearch}
                sortField={drawings.sortField}
                setSortField={drawings.setSortField}
                sortDir={drawings.sortDir}
                setSortDir={drawings.setSortDir}
                viewMode={drawings.viewMode}
                setViewMode={drawings.setViewMode}
                onOpenSetup={() => setShowSetup(true)}
                onNewDrawing={openNewDrawingModal}
              />
              <DrawingList
                loadingDrawings={drawings.loadingDrawings}
                filtered={drawings.filtered}
                viewMode={drawings.viewMode}
                isArchived={isArchived}
                sortField={drawings.sortField}
                sortDir={drawings.sortDir}
                toggleSort={drawings.toggleSort}
                onOpen={openDrawing}
                onView={viewer.open}
                onDelete={setDeleteConfirm}
                onBlocked={() => setArchivedNotice(true)}
                onNewDrawing={openNewDrawingModal}
              />
            </>
          )}
        </div>
      </div>

      {showNewProject && (
        <ProjectFormModal
          editingProject={editingProject}
          onClose={() => { setShowNewProject(false); setEditingProject(null); }}
          onSubmit={payload => editingProject ? projects.update(editingProject.id, payload) : projects.create(payload)}
          onCreated={p => projects.select(p)}
        />
      )}

      {showNewDrawing && (
        <DrawingFormModal
          onClose={() => setShowNewDrawing(false)}
          onSubmit={handleCreateDrawing}
        />
      )}

      {deleteConfirm && (
        <DeleteDrawingDialog
          drawing={deleteConfirm}
          error={deleteError}
          onCancel={() => { setDeleteConfirm(null); setDeleteError(""); }}
          onConfirm={handleDeleteDrawing}
        />
      )}

      {archiveConfirm && (
        <ArchiveProjectDialog
          project={archiveConfirm}
          onCancel={() => setArchiveConfirm(null)}
          onConfirm={() => handleArchiveProject(archiveConfirm.id)}
        />
      )}

      {archivedNotice && (
        <ArchivedNoticeDialog onClose={() => setArchivedNotice(false)} />
      )}

      {viewer.viewerDrawing && (
        <DrawingViewerOverlay
          viewer={viewer}
          selectedProject={projects.selectedProject}
          onClose={viewer.close}
        />
      )}

      {showSetup && projects.selectedProject && (
        <ProjectSetup
          project={projects.selectedProject}
          onClose={() => setShowSetup(false)}
        />
      )}

    </div>
  );
}

export default ProjectsPage;
