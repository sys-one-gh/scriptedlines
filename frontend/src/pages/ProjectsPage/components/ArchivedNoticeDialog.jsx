// ─────────────────────────────────────────────────────────────
// ArchivedNoticeDialog.jsx — shown when a blocked action (Open,
// Delete, + New Drawing) is attempted on an archived project.
// ─────────────────────────────────────────────────────────────

function ArchivedNoticeDialog({ onClose }) {
  return (
    <div className="pp-overlay pp-overlay--top">
      <div className="pp-modal pp-modal--sm">
        <div className="pp-modal-header">
          <div className="pp-modal-title">Project Archived</div>
          <button className="pp-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="pp-delete-info">
          <div className="pp-delete-warning">
            ⚠ This is an archived project. You won't be able to create or edit drawings until you restore the project from the Archive tab.
          </div>
        </div>
        <div className="pp-modal-footer">
          <div />
          <div className="pp-footer-group">
            <button className="pp-btn-add" onClick={onClose}>Got it</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArchivedNoticeDialog;
