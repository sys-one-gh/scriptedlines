// ─────────────────────────────────────────────────────────────
// ArchiveProjectDialog.jsx — confirm-archive for a single project.
// ─────────────────────────────────────────────────────────────

function ArchiveProjectDialog({ project, onCancel, onConfirm }) {
  return (
    <div className="pp-overlay pp-overlay--top">
      <div className="pp-modal pp-modal--sm">
        <div className="pp-modal-header">
          <div className="pp-modal-title">Archive Project</div>
          <button className="pp-modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="pp-delete-info">
          <div className="pp-delete-info-text">Archive this project?</div>
          <div className="pp-delete-info-card">
            <div className="pp-archive-line">
              {project.job_number && <>
                <span className="pp-archive-jobnum">{project.job_number}</span>
                <span className="pp-archive-sep"> — </span>
              </>}
              <span className="pp-archive-pname">{project.project_name}</span>
            </div>
          </div>
          <div className="pp-delete-warning">
            ⚠ Archiving sets this project to read-only. You won't be able to add or edit drawings until you restore it from the Archive tab.
          </div>
        </div>
        <div className="pp-modal-footer">
          <div />
          <div className="pp-footer-group">
            <button className="pp-btn-discard" onClick={onCancel}>Discard</button>
            <button className="pp-btn-add" onClick={onConfirm}>Archive Project</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArchiveProjectDialog;
