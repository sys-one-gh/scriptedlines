// ─────────────────────────────────────────────────────────────
// ProjectSidebar.jsx
//
// Left panel: Active/Archived tabs, the project list, and each
// row's "⋯" context menu (Edit/Archive/Restore/Delete). Doesn't
// own its own width or the divider next to it — those live in
// ProjectsPage.jsx since the divider is a sibling, not a child,
// of this panel (see useResizableSidebar usage there).
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { useOutsideClick } from "../../../shared/useOutsideClick.js";

function ProjectSidebar({
  widthPct, activeProjects, archivedProjects, loadingProjects,
  filteredActiveProjects, filteredArchivedProjects,
  projectSearch, setProjectSearch,
  projectTab, setProjectTab, selectedProject,
  onSelect, onNewProject, onEditProject, onArchiveProject, onRestoreProject,
}) {
  const [projectMenuId, setProjectMenuId] = useState(null);
  const projectMenuRef = useRef(null);
  useOutsideClick(projectMenuRef, () => setProjectMenuId(null));

  // Tab badges show the true total; the list below reflects the search.
  const displayedProjects = projectTab === "active" ? filteredActiveProjects : filteredArchivedProjects;
  const hasSearch = projectSearch.trim().length > 0;

  function handleSelect(p) {
    setProjectMenuId(null);
    onSelect(p);
  }

  return (
    <div className="pp-left-panel" style={{ width: `${widthPct}%` }}>
      <div className="pp-explorer-header">
        <span className="pp-explorer-title">PROJECT EXPLORER</span>
        <button className="pp-explorer-add-btn" onClick={onNewProject}>+ New</button>
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

      <div className="pp-sidebar-search-strip">
        <div className="pp-search-wrap">
          <span className="pp-search-icon">⌕</span>
          <input
            className="pp-search-input pp-sidebar-search-input"
            type="text"
            placeholder="Search projects..."
            value={projectSearch}
            onChange={e => setProjectSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="pp-explorer-list">
        {loadingProjects ? (
          <div className="pp-placeholder">Loading...</div>
        ) : displayedProjects.length === 0 ? (
          <div className="pp-placeholder">
            {hasSearch ? (
              `No ${projectTab} projects match "${projectSearch.trim()}".`
            ) : (
              <>
                {projectTab === "active" ? "No active projects." : "No archived projects."}
                {projectTab === "active" && (
                  <button className="pp-inline-btn" onClick={onNewProject}>+ Create first project</button>
                )}
              </>
            )}
          </div>
        ) : (
          displayedProjects.map(p => {
            const isActive = selectedProject?.id === p.id;
            return (
              <div key={p.id}
                className={`pp-project-row${isActive ? " pp-project-row--active" : ""}`}
                onClick={() => handleSelect(p)}>
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
                          <button className="pp-popover-item" onClick={() => { setProjectMenuId(null); onEditProject(p); }}>✏️  Edit Project</button>
                          <div className="pp-menu-divider" />
                          <button className="pp-popover-item" onClick={() => { setProjectMenuId(null); onArchiveProject(p); }}>📦  Archive Project</button>
                        </>
                      ) : (
                        <>
                          <button className="pp-popover-item" onClick={() => { setProjectMenuId(null); onRestoreProject(p.id); }}>↩  Restore Project</button>
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
  );
}

export default ProjectSidebar;
